import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { FileText, File, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Document {
  id: string;
  name: string;
  filename: string;
  type: 'pdf' | 'md';
  category: string;
  path: string;
}

export default function Docs() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/library/docs`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setDocs(data.documents);
        }
      })
      .catch(e => console.error("Error loading library", e))
      .finally(() => setLoading(false));
  }, []);

  const filteredDocs = docs.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const handleOpenDoc = (path: string) => {
    window.open(`${API_BASE}/api/library/download?path=${encodeURIComponent(path)}`, '_blank');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Biblioteca Documental</h1>
          <p className="text-muted-foreground mt-2">
            Repositorio centralizado de manuales operativos, estándares de instalación y reportes estratégicos.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar documentos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-muted-foreground">Cargando repositorio...</div>
      ) : Object.keys(groupedDocs).length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border rounded-lg border-dashed">
          No se encontraron documentos en la biblioteca.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedDocs).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-primary/90">{category}</h2>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(doc => (
                  <Card 
                    key={doc.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md group"
                    onClick={() => handleOpenDoc(doc.path)}
                  >
                    <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                      <div className={`p-2 rounded-lg ${doc.type === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {doc.type === 'pdf' ? <FileText size={24} /> : <File size={24} />}
                      </div>
                      <Badge variant="outline" className={`uppercase text-[10px] ${doc.type === 'pdf' ? 'border-red-500/30 text-red-500' : 'border-blue-500/30 text-blue-500'}`}>
                        {doc.type}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-base leading-tight mb-2 group-hover:text-primary transition-colors">
                        {doc.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {doc.filename}
                      </p>
                      
                      <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="mr-2 h-3 w-3" /> Descargar / Ver
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
