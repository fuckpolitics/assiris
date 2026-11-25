from pathlib import Path
import shutil

root = Path(".")
overrides = Path("overrides")
components = root / "components"

shutil.copy2(overrides / "Echo.tsx", components / "Echo.tsx")
shutil.copy2(overrides / "Landing.tsx", components / "Landing.tsx")

archive = components / "Archive.tsx"
s = archive.read_text(encoding="utf-8")
if 'import Landing from "./Landing";' not in s:
    s = s.replace('import Reader, { ReadControls } from "./Reader";', 'import Reader, { ReadControls } from "./Reader";\nimport Landing from "./Landing";')
s = s.replace('<Home works={works} settings={settings} />', '<Landing works={works} settings={settings} />')
s = s.replace('["/library", "Книга"]', '["/library", "Произведения"]')
s = s.replace('Разделы книги', 'Разделы')
s = s.replace('Книга открывается без регистрации.', 'Произведения доступны без регистрации.')
s = s.replace('Книга произведений', 'Все произведения')
archive.write_text(s, encoding="utf-8")

reader = components / "Reader.tsx"
s = reader.read_text(encoding="utf-8")
if 'import Echo from "./Echo";' not in s:
    s = s.replace('import {\n  Work,', 'import Echo from "./Echo";\nimport {\n  Work,')
s = s.replace('  Image as ImageIcon,\n  ExternalLink,', '  Image as ImageIcon,\n  ExternalLink,')
s = s.replace('    [resume, setResume] = useState(0);', '    [resume, setResume] = useState(0),\n    [echoOpen, setEchoOpen] = useState(false);')
old = '''            {selection && !sharing && (
              <button className="btn outline" onClick={() => setSharing(true)}>
                <Quote />
                Цитировать выделенное
              </button>
            )}'''
new = '''            {selection && !sharing && (
              <div className="selection-actions">
                <button className="btn outline" onClick={() => setEchoOpen(true)}>
                  <Link2 /> Найти эхо
                </button>
                <button className="btn quiet" onClick={() => setSharing(true)}>
                  <Quote /> Цитировать
                </button>
              </div>
            )}'''
if old in s:
    s = s.replace(old, new)
if '{echoOpen && !focus && (' not in s:
    s = s.replace('      {sharing && !focus && (', '''      {echoOpen && !focus && (
        <Echo phrase={selection} works={works} currentId={w.id} onClose={() => setEchoOpen(false)} />
      )}
      {sharing && !focus && (''')
reader.write_text(s, encoding="utf-8")

catalog = components / "Catalog.tsx"
s = catalog.read_text(encoding="utf-8")
s = s.replace('Поиск по книге', 'Поиск по произведениям')
s = s.replace('Онлайн-книга Александра Андрианова', 'Архив произведений Александра Андрианова')
catalog.write_text(s, encoding="utf-8")

prerender = root / "standalone" / "prerender.tsx"
s = prerender.read_text(encoding="utf-8")
s = s.replace('Авторская книга Александра Андрианова:', 'Архив произведений Александра Андрианова:')
s = s.replace('Вернуться к книге', 'На главную')
prerender.write_text(s, encoding="utf-8")

css = root / "public" / "site.css"
with css.open("a", encoding="utf-8") as f:
    f.write("\n" + (overrides / "experience.css").read_text(encoding="utf-8") + "\n")

print("Applied ASSIRIS experience overrides.")
