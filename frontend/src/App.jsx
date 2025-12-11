import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const sizes = [
  { label: 'Square (1024x1024)', value: '1024x1024' },
  { label: 'Landscape (1792x1024)', value: '1792x1024' },
  { label: 'Portrait (1024x1792)', value: '1024x1792' },
]

async function dataUrlToFile(dataUrl, filename) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const type = blob.type || 'image/png'
  return new File([blob], filename, { type })
}

function App() {
  const [prompt, setPrompt] = useState('')
  const [size, setSize] = useState('1024x1024')
  const [generatedImage, setGeneratedImage] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  const [editPrompt, setEditPrompt] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editedImage, setEditedImage] = useState('')
  const [sourceImagePreview, setSourceImagePreview] = useState('')
  const [sourceFile, setSourceFile] = useState(null)

  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setError('')
    setGenLoading(true)
    setGeneratedImage('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, size }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImage(data.image)
      setSourceImagePreview(data.image)
      setSourceFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenLoading(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSourceFile(file)
    setSourceImagePreview(URL.createObjectURL(file))
  }

  const handleUseGenerated = () => {
    setSourceFile(null)
    setSourceImagePreview(generatedImage)
  }

  const handleEdit = async () => {
    setError('')
    setEditLoading(true)
    setEditedImage('')

    try {
      let fileToSend = sourceFile

      if (!fileToSend && sourceImagePreview) {
        fileToSend = await dataUrlToFile(sourceImagePreview, 'generated.png')
      }

      if (!fileToSend) {
        throw new Error('Please upload or generate an image to edit')
      }

      if (!editPrompt.trim()) {
        throw new Error('Please provide an edit prompt')
      }

      const formData = new FormData()
      formData.append('prompt', editPrompt)
      formData.append('image', fileToSend)

      const response = await fetch(`${API_BASE_URL}/api/edit-image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to edit image')
      }

      const data = await response.json()
      setEditedImage(data.image)
    } catch (err) {
      setError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <p className="eyebrow">OpenAI image-gen-1</p>
          <h1>Create & Edit Images</h1>
          <p className="subtext">Generate a base image, then refine it with a new prompt.</p>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Generate image</h2>
            </div>
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              {sizes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="field">
            <span>Generation prompt</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. a cozy cabin in the mountains during sunset"
              rows={3}
            />
          </label>

          <button className="primary" onClick={handleGenerate} disabled={genLoading}>
            {genLoading ? 'Generating...' : 'Generate image'}
          </button>

          <div className="image-frame">
            {generatedImage ? (
              <img src={generatedImage} alt="Generated" />
            ) : (
              <p className="placeholder">Your generated image will appear here.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Edit image</h2>
            </div>
            <div className="actions">
              <label className="secondary" htmlFor="upload-input">
                Upload image
              </label>
              <input id="upload-input" type="file" accept="image/*" onChange={handleFileChange} hidden />
              <button
                className="secondary"
                type="button"
                onClick={handleUseGenerated}
                disabled={!generatedImage}
              >
                Use generated image
              </button>
            </div>
          </div>

          <label className="field">
            <span>Edit prompt</span>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. add a light snowfall and smoke from the chimney"
              rows={3}
            />
          </label>

          <button className="primary" onClick={handleEdit} disabled={editLoading}>
            {editLoading ? 'Editing...' : 'Edit image'}
          </button>

          <div className="image-frame">
            {sourceImagePreview ? (
              <img src={sourceImagePreview} alt="Source" />
            ) : (
              <p className="placeholder">Upload or use the generated image to edit.</p>
            )}
          </div>

          <div className="image-frame">
            {editedImage ? <img src={editedImage} alt="Edited" /> : <p className="placeholder">Edited image will appear here.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
