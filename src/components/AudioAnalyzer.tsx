import React, { useState } from 'react';

const AudioAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/classify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data.classification);
    } catch (error) {
      console.error('Error during classification:', error);
      setResult('Error classifying the audio.');
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Audio Classifier (YAMNet)</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {loading ? 'Analyzing...' : 'Classify Audio'}
      </button>
      {result && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <strong>Detected Sounds:</strong> {result}
        </div>
      )}
    </div>
  );
};

export default AudioAnalyzer;
