const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function enviarImagemCloudinary(file) {
  if (!cloudName || !uploadPreset) {
    throw new Error('Configure o Cloudinary no arquivo .env.local.')
  }

  if (!file?.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem válido.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const dados = new FormData()
  dados.append('file', file)
  dados.append('upload_preset', uploadPreset)

  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: dados,
  })
  const resultado = await resposta.json()

  if (!resposta.ok) {
    throw new Error(resultado.error?.message || 'Não foi possível enviar a imagem.')
  }

  return {
    imageUrl: resultado.secure_url,
    imagePublicId: resultado.public_id,
  }
}