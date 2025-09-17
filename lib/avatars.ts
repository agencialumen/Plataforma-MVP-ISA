// Sistema de avatares predefinidos para usuários
export const AVATAR_OPTIONS = [
  {
    id: "avatar-1",
    name: "Homem-Aranha",
    url: "/avatars/aranha.jpg",
  },
  {
    id: "avatar-2",
    name: "Einstein",
    url: "/avatars/einstbaseado.jpg",
  },
  {
    id: "avatar-3",
    name: "Mr. Robot",
    url: "/avatars/mrrobot.jpg",
  },
  {
    id: "avatar-4",
    name: "Xablau",
    url: "/avatars/xablau.jpg",
  },
  {
    id: "avatar-5",
    name: "Scarface",
    url: "/avatars/scarface.jpg",
  },
  {
    id: "avatar-6",
    name: "Mágico",
    url: "/avatars/magico.jpg",
  },
  {
    id: "avatar-7",
    name: "Matrix",
    url: "/avatars/matrix.jpg",
  },
  {
    id: "avatar-8",
    name: "Belford",
    url: "/avatars/belford.jpg",
  },
]

export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * AVATAR_OPTIONS.length)
  return AVATAR_OPTIONS[randomIndex]
}

export const getAvatarById = (id: string) => {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === id) || AVATAR_OPTIONS[0]
}
