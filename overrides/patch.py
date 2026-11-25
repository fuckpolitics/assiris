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
# Add the Echo panel state inside the Reader component before its other hooks.
if "const [echoOpen, setEchoOpen] = useState(false);" not in s:
    import re
    s, count = re.subn(
        r'(export default function Reader[\s\S]*?\)\s*\{\n)',
        r'\1  const [echoOpen, setEchoOpen] = useState(false);\n',
        s,
        count=1,
    )
    if count == 0:
        raise SystemExit("Could not locate the Reader component to add Echo state.")
if 'import Echo from "./Echo";' not in s:
    s = s.replace('import {\n  Work,', 'import Echo from "./Echo";\nimport {\n  Work,')
s = s.replace('  Image as ImageIcon,\n  ExternalLink,', '  Image as ImageIcon,\n  Link2,\n  ExternalLink,')
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
s = s.replace('useState("author")', 'useState("new")')
s = s.replace('              <option value="author">Авторский порядок</option>\n', '')
catalog.write_text(s, encoding="utf-8")

prerender = root / "standalone" / "prerender.tsx"
s = prerender.read_text(encoding="utf-8")
s = s.replace('Авторская книга Александра Андрианова:', 'Архив произведений Александра Андрианова:')
s = s.replace('Вернуться к книге', 'На главную')
s = s.replace('Книга произведений', 'Все произведения')
prerender.write_text(s, encoding="utf-8")

css = root / "public" / "site.css"
with css.open("a", encoding="utf-8") as f:
    f.write("\n" + (overrides / "experience.css").read_text(encoding="utf-8") + "\n")

export_block = '''          {page === "favorites" && matches.length > 0 && (
            <button
              className="textlink"
              onClick={() =>
                fileDownload(
                  new Blob(
                    [
                      matches
                        .map((w) => w.title + "\\n" + location.origin + urlOf(w))
                        .join("\\n\\n"),
                    ],
                    { type: "text/plain;charset=utf-8" },
                  ),
                  "assiris-izbrannoe.txt",
                )
              }
            >
              <Download size={15} />
              Экспорт
            </button>
          )}'''
catalog_text = catalog.read_text(encoding="utf-8")
catalog_text = catalog_text.replace(export_block, "")
catalog.write_text(catalog_text, encoding="utf-8")

reader_text = reader.read_text(encoding="utf-8")
reader_text = reader_text.replace('''                <button
                  className="option"
                  onClick={() => quoteCard(w, selection)}
                >
                  <ImageIcon size={15} /> Скачать карточку цитаты
                </button>
''', "")
reader.write_text(reader_text, encoding="utf-8")

# Remove the biography page and author-order navigation.
import re
archive_text = archive.read_text(encoding="utf-8")
archive_text = archive_text.replace('    ["/about", "Об авторе"],\n', "")
archive_text = re.sub(
    r'\) : page === "about" \? \(.*?\n        \) : \(\n          <section className="wrap inner narrow">',
    ') : (\n          <section className="wrap inner narrow">',
    archive_text,
    count=1,
    flags=re.S,
)
archive_text = archive_text.replace('"Разделы книги"', '"Разделы"')
archive_text = archive_text.replace('Книга открывается без регистрации.', 'Архив доступен без регистрации.')
archive_text = archive_text.replace('Книга произведений', 'Все произведения')
archive_text = archive_text.replace('Онлайн-книга Александра Андрианова', 'ТЕКСТЫ АЛЕКСАНДРА АНДРИАНОВА')
archive.write_text(archive_text, encoding="utf-8")

catalog_text = catalog.read_text(encoding="utf-8")
catalog_text = catalog_text.replace('useState("author")', 'useState("new")')
catalog_text = catalog_text.replace('              <option value="author">Авторский порядок</option>\n', '')
catalog_text = catalog_text.replace('Поиск по книге', 'Поиск по произведениям')
catalog_text = catalog_text.replace('Онлайн-книга Александра Андрианова', 'Архив произведений')
catalog.write_text(catalog_text, encoding="utf-8")

prerender_text = prerender.read_text(encoding="utf-8")
prerender_text = prerender_text.replace('  ["about"],\n', '')
prerender_text = prerender_text.replace('  about: "Об авторе",\n', '')
prerender_text = prerender_text.replace('Авторская книга Александра Андрианова: стихотворения, проза и литературные циклы.', 'Стихотворения и проза Александра Андрианова.')
prerender_text = prerender_text.replace('Вернуться к книге', 'На главную')
prerender.write_text(prerender_text, encoding="utf-8")

print("Applied ASSIRIS atlas experience.")
