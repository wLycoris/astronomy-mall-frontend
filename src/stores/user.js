import { defineStore } from 'pinia'
import { login, getUserInfo, logout } from '@/api/user'
import { setToken, removeToken, getToken } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',       // 初始化时从 cookie 中读取 token
    userInfo: null
  }),

  getters: {
    // 登录状态
    isLoggedIn: (state) => {
      const t = state.token
      return !!t && t !== 'undefined' && t !== 'null'
    }
  },

  actions: {
    // 登录
    async login(loginForm) {
      const res = await login(loginForm)
      this.token = res.data.token
      this.userInfo = res.data.userInfo
      setToken(res.data.token)
      return res
    },

    // 获取用户信息
    async fetchUserInfo() {
      if (!this.token) return
      const res = await getUserInfo()
      this.userInfo = res.data
      return res
    },

    // 登出
    async logout() {
      await logout()
      this.token = ''
      this.userInfo = null
      removeToken()
    },

    // 刷新页面恢复登录状态
    async restoreLogin() {
      const token = getToken()
      if (token) {
        this.token = token
        try {
          await this.fetchUserInfo()
        } catch (err) {
          // token 失效
          this.logout()
        }
      }
    }
  }
})