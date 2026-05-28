import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const PublicReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(`/api/public-report/${id}`);
        setContent(response.data.content);
      } catch (err) {
        console.error('Error fetching public report:', err);
        setError('El informe no existe o ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Informe No Encontrado</h1>
        <p className="text-gray-600 text-center max-w-md">
          {error || 'No se pudo cargar el informe solicitado.'}
        </p>
      </div>
    );
  }

  return (
    <div className="public-report-viewer bg-white min-h-screen">
      <style>{`
        /* Overwrite any global app styles for the public view */
        html, body {
          background-color: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        #root {
          max-width: none !important;
          width: 100% !important;
        }
      `}</style>
      <div 
        className="public-report-content"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );
};

export default PublicReportView;
