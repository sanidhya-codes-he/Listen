# windows: the real system calls behind the primitives (tests use FakeSystem instead)
import ctypes
import os
from ctypes import wintypes
from pathlib import Path
from typing import Any

from listen_agent.actions.registry import ActionError

_user32 = ctypes.WinDLL("user32", use_last_error=True)
_kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
_shell32 = ctypes.WinDLL("shell32", use_last_error=True)
_ole32 = ctypes.WinDLL("ole32")

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
_user32.SetForegroundWindow.restype = wintypes.BOOL
_user32.GetClassNameW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
_kernel32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
_kernel32.OpenProcess.restype = wintypes.HANDLE
_kernel32.QueryFullProcessImageNameW.argtypes = [
    wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
_kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
_kernel32.GetProcessId.argtypes = [wintypes.HANDLE]
_kernel32.GetProcessId.restype = wintypes.DWORD
_ole32.CoInitializeEx.argtypes = [ctypes.c_void_p, wintypes.DWORD]
_ole32.CoInitializeEx.restype = ctypes.c_long  # an HRESULT: below 0 means it failed

_GW_OWNER, _WM_CLOSE, _SW_RESTORE = 4, 0x0010, 9
_PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
_SEE_MASK_NOCLOSEPROCESS, _SW_SHOWNORMAL = 0x40, 1
_COINIT_APARTMENTTHREADED, _COINIT_DISABLE_OLE1DDE = 0x2, 0x4
# the desktop and the taskbar belong to explorer.exe too; closing "File Explorer" must spare them
_SHELL_CLASSES = {"Progman", "WorkerW", "Shell_TrayWnd", "Shell_SecondaryTrayWnd"}


class _ShellExecuteInfo(ctypes.Structure):  # SHELLEXECUTEINFOW
    _fields_ = [
        ("cbSize", wintypes.DWORD), ("fMask", wintypes.ULONG), ("hwnd", wintypes.HWND),
        ("lpVerb", wintypes.LPCWSTR), ("lpFile", wintypes.LPCWSTR),
        ("lpParameters", wintypes.LPCWSTR), ("lpDirectory", wintypes.LPCWSTR),
        ("nShow", ctypes.c_int), ("hInstApp", wintypes.HINSTANCE), ("lpIDList", ctypes.c_void_p),
        ("lpClass", wintypes.LPCWSTR), ("hkeyClass", wintypes.HKEY), ("dwHotKey", wintypes.DWORD),
        ("hIconOrMonitor", wintypes.HANDLE), ("hProcess", wintypes.HANDLE),
    ]


_shell32.ShellExecuteExW.argtypes = [ctypes.POINTER(_ShellExecuteInfo)]
_shell32.ShellExecuteExW.restype = wintypes.BOOL


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


def _class_of(window: int) -> str:
    buffer = ctypes.create_unicode_buffer(256)
    _user32.GetClassNameW(window, buffer, len(buffer))
    return buffer.value


class WindowsSystem:
    def __init__(self, apps: Any) -> None:
        self.apps = apps  # the app index (S2-03): the only way to name an app

    def open_url(self, url: str) -> None:
        os.startfile(url)  # the default browser

    def launch(self, shortcut: Path) -> int | None:
        # like a double-click: Windows applies the shortcut's arguments, "Start in" folder and file
        # type, and gives a console program its own window
        info = _ShellExecuteInfo(cbSize=ctypes.sizeof(_ShellExecuteInfo),
                                 fMask=_SEE_MASK_NOCLOSEPROCESS, lpFile=str(shortcut),
                                 nShow=_SW_SHOWNORMAL)
        # Microsoft: initialise COM first, shortcuts may be handled by COM shell extensions
        com = _ole32.CoInitializeEx(None, _COINIT_APARTMENTTHREADED | _COINIT_DISABLE_OLE1DDE)
        try:
            started = _shell32.ShellExecuteExW(ctypes.byref(info))
        finally:
            if com >= 0:
                _ole32.CoUninitialize()
        if not started:
            raise ActionError("the app could not be started")  # never the path: it names the app
        if not info.hProcess:
            return None  # store apps, or apps handed to a copy already running: no process of ours
        try:
            return _kernel32.GetProcessId(info.hProcess) or None
        finally:
            _kernel32.CloseHandle(info.hProcess)

    def windows_of(self, program: Path) -> list[int]:
        """Visible top-level windows whose process runs this program."""
        wanted = os.path.normcase(str(program))
        found: list[int] = []

        def visit(window, _):
            if (_user32.IsWindowVisible(window) and not _user32.GetWindow(window, _GW_OWNER)
                    and _class_of(window) not in _SHELL_CLASSES):
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
        if not _user32.SetForegroundWindow(window):
            # Windows often refuses this to a program running in the background
            raise ActionError("Windows did not let Listen bring that app to the front")

    def close_window(self, window: int) -> None:
        _user32.PostMessageW(window, _WM_CLOSE, 0, 0)  # the same message clicking X sends
