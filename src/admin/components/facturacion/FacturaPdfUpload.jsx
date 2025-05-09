import React, { useState } from "react";

export default function FacturaPdfUpload() {
    const [file, setFile] = useState(null);
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setDatos(null);
        setError("");
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError("");
        setDatos(null);
        const formData = new FormData();
        formData.append("pdf", file);
        try {
            const res = await fetch("http://localhost:4000/api/extract-factura", {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (json.exito) {
                setDatos(json.datos);
            } else {
                setError(json.error || "Error al extraer datos del PDF");
            }
        } catch (err) {
            setError("Error de red o de servidor: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
            <h2>Subir factura PDF y extraer datos</h2>
            <form onSubmit={handleUpload}>
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                <button type="submit" disabled={!file || loading} style={{ marginLeft: 16 }}>
                    {loading ? "Procesando..." : "Subir y extraer"}
                </button>
            </form>
            {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
            {datos && (
                <div style={{ marginTop: 24 }}>
                    <h3>Datos extraídos:</h3>
                    <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 4 }}>{JSON.stringify(datos, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
