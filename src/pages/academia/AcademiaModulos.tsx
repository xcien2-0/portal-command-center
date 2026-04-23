import { useEffect, useState } from 'react';
import { useAcademia } from './AcademiaLayout';
import { FileText, ArrowLeft, ExternalLink } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function AcademiaModulos() {
  const { technician } = useAcademia();
  const [docs, setDocs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/docs`)
      .then(r => r.json())
      .then(setDocs)
      .catch(() => setDocs([]));
  }, []);

  const openDoc = async (filename: string) => {
    setSelected(filename);
    setLoading(true);
    try {
      const r = await fetch(`${API}/docs/${encodeURIComponent(filename)}`);
      const data = await r.json();
      setContent(data.contenido ?? data.content ?? JSON.stringify(data, null, 2));
    } catch {
      setContent('Error al cargar el documento.');
    } finally {
      setLoading(false);
    }
  };

  const formatName = (filename: string) =>
    filename.replace(/_/g, ' ').replace(/\.md$/, '').replace(/\b\w/g, c => c.toUpperCase());

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a biblioteca
        </button>
        <div className="rounded-2xl p-6 bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          <h1 className="text-lg font-semibold mb-4">{formatName(selected)}</h1>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Cargando...</div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">{content}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Biblioteca XCIEN</h1>
        <p className="text-sm text-gray-400 mt-1">Estándares, manuales y protocolos operativos</p>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📚</div>
          <p>No hay documentos disponibles o el servidor no está corriendo.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <button
              key={doc}
              onClick={() => openDoc(doc)}
              className="text-left rounded-2xl p-5 bg-white hover:shadow-md transition-all cursor-pointer"
              style={{ border: '0.5px solid #e5e7eb' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#1B7F4A18' }}>
                  <FileText className="w-5 h-5" style={{ color: '#1B7F4A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug">{formatName(doc)}</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Estándar XCIEN · .md</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
