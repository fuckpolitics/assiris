import { useMemo } from "react";
import { ArrowUpRight, AudioLines, X } from "lucide-react";
import { Work, norm, urlOf } from "../lib/archive/reader";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

export default function Echo({
  phrase,
  works,
  currentId,
  onClose,
}: {
  phrase: string;
  works: Work[];
  currentId: string;
  onClose: () => void;
}) {
  const results = useMemo(() => {
    const needle = norm(phrase.trim()).replace(/\s+/gu, " ");
    if (!needle) return [];
    const isPhrase = /\s/u.test(needle);
    const source = escapeRegExp(needle).replaceAll("е", "[её]").replaceAll(" ", "\\s+");
    const pattern = isPhrase
      ? new RegExp(source, "giu")
      : new RegExp(`(^|[^\\p{L}\\p{N}_])(${source})(?=$|[^\\p{L}\\p{N}_])`, "giu");
    return works
      .filter((work) => work.id !== currentId)
      .map((work) => {
        const lines = work.text.split("\n");
        const matches: { line: string; index: number; count: number }[] = [];
        lines.forEach((line, index) => {
          const found = [...norm(line).matchAll(new RegExp(pattern.source, "giu"))].length;
          if (found) matches.push({ line, index, count: found });
        });
        return { work, matches, count: matches.reduce((sum, item) => sum + item.count, 0) };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.work.order - b.work.order);
  }, [phrase, works, currentId]);

  const total = results.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="echo-veil" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="echo-panel" role="dialog" aria-modal="true" aria-label="Текстовые переклички">
        <div className="echo-topline"><span><AudioLines size={15}/> ТЕКСТОВЫЕ ПЕРЕКЛИЧКИ</span><button className="iconbtn" onClick={onClose} aria-label="Закрыть"><X/></button></div>
        <div className="echo-heading"><span className="echo-kicker">НАЙДЕНО В АРХИВЕ</span><h2>«{phrase}»</h2><p>{total ? `${total} ${total === 1 ? "совпадение" : "совпадений"} в ${results.length} ${results.length === 1 ? "произведении" : "произведениях"}` : "Других точных совпадений не найдено"}</p></div>
        <div className="echo-results">
          {results.map(({ work, matches, count }) => (
            <a className="echo-result" href={urlOf(work)} key={work.id}>
              <div className="echo-result-meta"><span>{work.isProse ? "ПРОЗА" : work.isMiniature ? "МИНИАТЮРА" : "СТИХОТВОРЕНИЕ"}</span><span>{count} {count === 1 ? "раз" : "раза"}</span></div>
              <h3>{work.title}</h3>
              {matches.slice(0, 3).map((match) => <p className="echo-line" key={match.index}>{match.line.trim() || "…"}</p>)}
              {matches.length > 3 && <small>И ещё {matches.length - 3} строк</small>}
              <span className="echo-open">Открыть произведение <ArrowUpRight size={14}/></span>
            </a>
          ))}
          {!results.length && <div className="echo-empty">В других произведениях эта последовательность слов не встретилась. Можно попробовать выделить одно слово или другую строку.</div>}
        </div>
        <p className="echo-note">Здесь собраны только буквальные совпадения в текстах. Их смысл каждый читатель определяет сам.</p>
      </section>
    </div>
  );
}
