import Cookies from 'js-cookie'

const TOKEN_KEY = 'astronomy_token'

export function getToken() {
  const token = Cookies.get(TOKEN_KEY)
  console.log('getToken() from Cookies:', token ? '存在' : '不存在')
  return token
}

export function setToken(token) {
  console.log('setToken() to Cookies:', token)
  return Cookies.set(TOKEN_KEY, token, { expires: 7 })
}

export function removeToken() {
  console.log('removeToken() from Cookies')
  return Cookies.remove(TOKEN_KEY)
}