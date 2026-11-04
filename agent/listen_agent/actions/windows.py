# windows: the real system calls behind the primitives (tests use FakeSystem instead)
import ctypes
import os
import subprocess
from ctypes import wintypes
from pathlib import Path
from typing import Any

_user32 = ctypes.WinDLL("user32", use_last_error=True)
_kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

# declared types, so 64-bit window and process handles are never cut short
_EnumProc = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
_user32.EnumWindows.argtypes = [_EnumProc, wintypes.LPARAM]
_user32.IsWindowVisible.argtypes = [wintypes.HWND]
_user32.GetWindow.argtypes = [wintypes.HWND, wintypes.UINT]
_user32.GetWindow.restype = wintypes.HWND
_user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
_user32.PostMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
_user32.IsIconic.argtypes = [wintypes.HWND]
_user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
_user32.SetForegroundWindow.argtypes = [wintypes.HWND]
_kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
_kernel32.OpenProcess.restype = wintypes.HANDLE
_kernel32.QueryFullProcessImageNameW.argtypes = [
    wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
_kernel32.CloseHandle.argtypes = [wintypes.HANDLE]

_GW_OWNER, _WM_CLOSE, _SW_RESTORE = 4, 0x0010, 9
_PROCESS_QUERY_LIMITED_INFORMATION = 0x1000


def _program_of(pid: int) -> str:
    # the full path of the program a process is running, or "" if Windows won't say
    handle = _kernel32.OpenProcess(_PROCESS_QUERY_LIMITED_INFORMATION, False, pid)
    if not handle:
        return ""
    try:
        size = wintypes.DWORD(32768)
        buffer = ctypes.create_unicode_buffer(size.value)
        if not _kernel32.QueryFullProcessImageNameW(handle, 0, buffer, ctypes.byref(size)):
            return ""
        return os.path.normcase(buffer.value)
    finally:
        _kernel32.CloseHandle(handle)


class WindowsSystem:
    def __init__(self, apps: Any) -> None:
        self.apps = apps  # the app index (S2-03): the only way to name an app

    def open_url(self, url: str) -> None:
        os.startfile(url)  # the default browser

    def launch(self, path: Path) -> int | None:
        if path.suffix.lower() == ".lnk":
            os.startfile(path)  # store apps start through their shortcut: no process id
            return None
        return subprocess.Popen([str(path)]).pid

    def windows_of(self, program: Path) -> list[int]:
        """Visible top-level windows whose process runs this program."""
        wanted = os.path.normcase(str(program))
        found: list[int] = []

        def visit(window, _):
            if _user32.IsWindowVisible(window) and not _user32.GetWindow(window, _GW_OWNER):
                pid = wintypes.DWORD()
                _user32.GetWindowThreadProcessId(window, ctypes.byref(pid))
                if _program_of(pid.value) == wanted:
                    found.append(window)
            return True

        _user32.EnumWindows(_EnumProc(visit), 0)
        return found

    def focus_window(self, window: int) -> None:
        if _user32.IsIconic(window):
            _user32.ShowWindow(window, _SW_RESTORE)  # un-minimise first
        _user32.SetForegroundWindow(window)

    def close_window(self, window: int) -> None:
        _user32.PostMessageW(window, _WM_CLOSE, 0, 0)  # the same message clicking X sends
