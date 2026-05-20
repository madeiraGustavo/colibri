'use client'

import { useState, useRef } from 'react'
import { siteConfig } from '@/config/site'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function OrcamentoForm() {
  const [form, setForm] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    city: '',
    message: '',
    widthCm: '',
    heightCm: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!form.requesterName.trim()) newErrors.requesterName = 'Nome é obrigatório'
    if (form.requesterName.length > 100) newErrors.requesterName = 'Máximo 100 caracteres'
    if (!form.requesterEmail.trim()) newErrors.requesterEmail = 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requesterEmail)) newErrors.requesterEmail = 'Email inválido'
    if (!form.requesterPhone.trim()) newErrors.requesterPhone = 'Telefone é obrigatório'
    if (!form.city.trim()) newErrors.city = 'Cidade é obrigatória'
    if (!form.message.trim()) newErrors.message = 'Descreva o que precisa'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(
      (f) => f.size <= MAX_FILE_SIZE && ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )
    setImages((prev) => [...prev, ...valid].slice(0, MAX_IMAGES))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('requesterName', form.requesterName)
      formData.append('requesterEmail', form.requesterEmail)
      formData.append('requesterPhone', form.requesterPhone)
      formData.append('city', form.city)
      formData.append('message', form.message)
      formData.append('source', 'orcamento-page')
      formData.append('quantity', '1')

      if (form.widthCm) formData.append('widthCm', form.widthCm)
      if (form.heightCm) formData.append('heightCm', form.heightCm)

      for (const img of images) {
        formData.append('images', img)
      }

      const res = await fetch(`${API_URL}/marketplace/quotes`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setErrors({ form: data.error ?? 'Erro ao enviar orçamento' })
      }
    } catch {
      setErrors({ form: 'Erro de conexão. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="mx-auto">
              <circle cx="32" cy="32" r="28" stroke="#D4A017" strokeWidth="3" fill="none" />
              <path d="M20 32l8 8 16-16" stroke="#D4A017" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1A1A1A' }}>Orçamento Enviado!</h2>
          <p className="text-gray-600">
            Recebemos sua solicitação. Entraremos em contato em breve pelo telefone ou email informado.
          </p>
          <a href="/" className="inline-block mt-8 px-6 py-3 bg-[#D4A017] text-[#1A1A1A] font-bold text-sm uppercase rounded">
            Voltar ao Catálogo
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Solicitar Orçamento</h1>
        <p className="mb-8 text-gray-600">
          Preencha o formulário abaixo e entraremos em contato com o valor e prazo para seu projeto.
        </p>

        {errors.form && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Nome completo *</label>
            <input
              type="text"
              value={form.requesterName}
              onChange={(e) => setForm((f) => ({ ...f, requesterName: e.target.value }))}
              className="w-full min-h-[44px] px-4 py-2 rounded text-sm border border-gray-300 bg-white text-gray-900"
              maxLength={100}
            />
            {errors.requesterName && <p className="text-xs mt-1 text-red-600">{errors.requesterName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Email *</label>
              <input
                type="email"
                value={form.requesterEmail}
                onChange={(e) => setForm((f) => ({ ...f, requesterEmail: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded text-sm border border-gray-300 bg-white text-gray-900"
              />
              {errors.requesterEmail && <p className="text-xs mt-1 text-red-600">{errors.requesterEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Telefone / WhatsApp *</label>
              <input
                type="tel"
                value={form.requesterPhone}
                onChange={(e) => setForm((f) => ({ ...f, requesterPhone: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded text-sm border border-gray-300 bg-white text-gray-900"
                maxLength={20}
              />
              {errors.requesterPhone && <p className="text-xs mt-1 text-red-600">{errors.requesterPhone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Cidade *</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full min-h-[44px] px-4 py-2 rounded text-sm border border-gray-300 bg-white text-gray-900"
              maxLength={100}
              placeholder="Ex: Rio Pomba - MG"
            />
            {errors.city && <p className="text-xs mt-1 text-red-600">{errors.city}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Largura (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.widthCm}
                onChange={(e) => setForm((f) => ({ ...f, widthCm: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded text-sm border border-gray-300 bg-white text-gray-900"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Altura (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                className="w-full min-h-[44px] px-4 py-2 rounded text-sm border border-gray-300 bg-white text-gray-900"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Descreva o que precisa *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full px-4 py-3 rounded text-sm resize-none border border-gray-300 bg-white text-gray-900"
              rows={4}
              maxLength={1000}
              placeholder="Ex: Preciso de um toldo retrátil para a varanda do restaurante, medindo aproximadamente 4m x 2m..."
            />
            {errors.message && <p className="text-xs mt-1 text-red-600">{errors.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">
              Fotos do local (opcional, até {MAX_IMAGES})
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 file:cursor-pointer hover:file:bg-gray-200"
              disabled={images.length >= MAX_IMAGES}
            />
            <p className="text-xs mt-1 text-gray-500">JPG, PNG ou WebP. Máximo 5MB por imagem.</p>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-gray-300">
                    <img src={URL.createObjectURL(img)} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-xs text-white bg-red-500 rounded-bl"
                      aria-label={`Remover imagem ${i + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] px-6 py-3 bg-[#D4A017] text-[#1A1A1A] font-bold text-sm uppercase rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B8860B] transition-colors"
          >
            {submitting ? 'Enviando...' : 'Enviar Orçamento'}
          </button>

          <p className="text-xs text-center text-gray-500">
            Ao enviar, você concorda em ser contatado pela equipe {siteConfig.name}.
          </p>
        </form>
      </div>
    </div>
  )
}
