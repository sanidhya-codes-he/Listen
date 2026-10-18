# builds pages/*.html: official React Bits sources (src/rb, unchanged on disk) wrapped in IIFEs,
# the shared shell (shared.jsx) and one page script each. Every page is one self-contained file.
import re
from pathlib import Path

src=Path(__file__).parent
rb=src/'rb'
out=src.parent

# components every page gets (the shell: dock, states, date range, toasts, hold-to-confirm)
SHARED=['Dock','LatticeLoader','FuzzyText','RotatingText','Radar','RubberSegment','SwipeToast','HoldButton']
PAGES={
    'login':    ('Listen Log in',   ['TechText','LineWaves','SpecularButton','Counter']),
    'overview': ('Listen Overview', ['TechText','InfiniteSpiral','FlowingMenu']),
    'history':  ('Listen History',  ['SplitFlapText','GlideSelect','SpotlightCard','Counter']),
    'apps':     ('Listen App usage',['Counter','OptionWheel','SpringCheck']),
    'commands': ('Listen Commands', ['Folder','SpotlightCard','Stepper','AnimatedList','StatusMark']),
    'insights': ('Listen Insights', ['MagicBento','BlurText']),
    'devices':  ('Listen Devices',  ['TearTicket','DecryptedText','SpecularButton','JellyRadio']),
    'index':    ('Listen Prototypes', []),
}

IMPORT=re.compile(r"^import\s+(.*?)\s+from\s+['\"]([^'\"]+)['\"];?[ \t]*$", re.M|re.S)
SIDE=re.compile(r"^import\s+['\"][^'\"]+['\"];?[ \t]*\n", re.M)

def named(spec):
    m=re.search(r"\{(.*)\}", spec, re.S)
    if not m: return []
    out=[]
    for part in m.group(1).split(','):
        part=part.strip()
        if not part: continue
        if ' as ' in part:
            a,b=[x.strip() for x in part.split(' as ')]
            out.append(f'{a}: {b}')
        else:
            out.append(part)
    return out

def convert(name, code):
    code=re.sub(r"^'use client';\s*\n", '', code)
    code=SIDE.sub('', code)
    pre=[]
    def imp(m):
        spec, mod=m.group(1), m.group(2)
        names=named(spec)
        if mod=='react':
            return f"const {{ {', '.join(names)} }} = React;" if names else ''
        if mod=='react-dom':
            return f"const {{ {', '.join(names)} }} = ReactDOM;"
        if mod=='motion/react':
            return f"const {{ {', '.join(names)} }} = Motion;"
        if mod=='@hugeicons/react':
            return ''   # global stand-in HugeiconsIcon
        if mod=='@hugeicons/core-free-icons':
            return '\n'.join(f"const {n} = '{n}';" for n in names)
        raise SystemExit(f'{name}: unhandled import {mod}')
    code=IMPORT.sub(imp, code)
    extra=re.findall(r"^export (?:function|const) (\w+)", code, re.M)
    code=re.sub(r"^export default \w+;\s*$", '', code, flags=re.M)
    code=code.replace('export default function ', 'function ')
    code=re.sub(r"^export (function|const) ", r"\1 ", code, flags=re.M)
    assert not re.search(r"^import ", code, re.M), name
    return code, [n for n in extra if n!=name]

def wrap(name):
    code=(rb/f'{name}.jsx').read_text(encoding='utf-8')
    if name=='InfiniteSpiral':
        # same adaptation as overview-v2: render item.content (a stat card) instead of an <img> when given
        code,n=re.subn(r"(\n\s*)<img\n(.*?)/>\n", lambda m: f"{m.group(1)}{{item.content ?? (<img\n{m.group(2)}/>)}}\n", code, count=1, flags=re.S)
        assert n==1
    if name=='SpringCheck':
        # it reads the tick's path out of the Hugeicons data array; the browser stand-in only has the path string
        code,n=re.subn(r"String\(Tick02Icon\[0\]\[1\]\.d\)", "HUGE_PATHS.Tick02Icon", code)
        assert n==1
    code,extra=convert(name, code)
    names=[name]+extra
    if extra:
        return f"/* ---- {name}: React Bits (official source) ---- */\nconst {{ {', '.join(names)} }} = (() => {{\n{code}\nreturn {{ {', '.join(names)} }};\n}})();\n"
    return f"/* ---- {name}: React Bits (official source) ---- */\nconst {name} = (() => {{\n{code}\nreturn {name};\n}})();\n"

def css(name):
    f=rb/f'{name}.css'
    return f"/* {name}.css (official) */\n"+f.read_text(encoding='utf-8') if f.exists() else ''

template=(src/'template.html').read_text(encoding='utf-8')
shared=(src/'shared.jsx').read_text(encoding='utf-8')
shared_css=(src/'shared.css').read_text(encoding='utf-8')
checks=src/'check'
checks.mkdir(exist_ok=True)

for page,(title,comps) in PAGES.items():
    pj=src/f'{page}.jsx'
    if not pj.exists():
        print('skip', page); continue
    names=list(dict.fromkeys(SHARED+comps))
    pcss=src/f'{page}.css'
    html=(template
          .replace('__TITLE__', title)
          .replace('/*__RBCSS__*/', '\n'.join(css(n) for n in names))
          .replace('/*__SHAREDCSS__*/', shared_css)
          .replace('/*__PAGECSS__*/', pcss.read_text(encoding='utf-8') if pcss.exists() else '')
          .replace('/*__COMPONENTS__*/', '\n'.join(wrap(n) for n in names))
          .replace('/*__SHARED__*/', shared)
          .replace('/*__PAGE__*/', pj.read_text(encoding='utf-8').replace('__PAGE_ID__', page)))
    (out/f'{page}.html').write_text(html, encoding='utf-8')
    script=html.split('<script type="text/babel" data-presets="react">')[1].split('</script>')[0]
    (checks/f'{page}.jsx').write_text(script, encoding='utf-8')
    print('wrote', page, len(html))
