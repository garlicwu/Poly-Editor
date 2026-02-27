import {computed, type Ref, ref} from 'vue'
import {defineStore} from 'pinia'
import {LStorage, SStorage} from '@/lib/storage'

// Mock getUserInfo function since backend is removed
const getUserInfo = () => {
  return Promise.resolve({
    data: {
      userInfo: {
        id: 'local-user',
        username: 'Local User',
        realname: 'Local User',
      }
    }
  })
}

export const userStore = defineStore('user', () => {
  const userInfo = ref({
    id: '',
    username: '',
    realname: '',
    avatar: '',
    birthday: '',
    sex: 1,
    email: '',
    phone: '',
    orgCode: '',
    loginTenantId: 0,
    orgCodeTxt: null,
    status: 1,
    delFlag: 0,
    workNo: '',
    post: null,
    telephone: null,
    createBy: null,
    createTime: '',
    updateBy: '',
    updateTime: '',
    activitiSync: 1,
    userIdentity: 2,
    departIds: '',
    relTenantIds: null,
    clientId: null,
    homePath: null,
    postText: null,
    bpmStatus: null,
    izBindThird: false,
    hasAllModelAuth: false,
    projectQuota: 0,
  })

  const userId = computed(() => userInfo.value.id)
  const userName = computed(() => userInfo.value.username)
  const mobile = computed(() => userInfo.value.telephone)
  const email = computed(() => userInfo.value.email)
  const hasAllModelAuth = computed(() => userInfo.value.hasAllModelAuth)
  const avatar = computed(() => userInfo.value.avatar)
  const projectQuota = computed(() => userInfo.value.projectQuota)
  const roles: Ref<any[]> = ref([])
  const permissions: Ref<any[]> = ref([])

  const themeConfig = ref({
    formBgImage: '',
    headerBg: '',
  })

  const formBgImage = computed(() => {
    return themeConfig.value.formBgImage
  })

  function setUserInfo(res: any) {
    console.log('setUserInfo called with:', res)
    // 确保res不为null或undefined
    if (res && typeof res === 'object') {
      // 检查是否包含嵌套的userInfo对象
      if (res.userInfo && typeof res.userInfo === 'object') {
        console.log('Found nested userInfo object, using it instead')
        res = res.userInfo // 使用嵌套的userInfo对象
      }

      // 检查是否包含username字段
      if (res.username) {
        console.log('Username found:', res.username)
      } else if (res.realname) {
        console.log('Realname found:', res.realname)
      } else {
        console.log('No username field in res')
        // 尝试检查可能的其他字段名
        console.log('Available fields:', Object.keys(res))
      }
      // 更新userInfo
      userInfo.value = res
      // 同时将用户信息保存到localStorage，以便页面刷新后可以恢复
      try {
        console.log('Saving userInfo to localStorage:', res)
        // 使用JSON.stringify确保正确存储对象
        localStorage.setItem('userInfo', JSON.stringify(res))
      } catch (e) {
        console.error('Error saving to localStorage:', e)
        // 备用方案：尝试使用LStorage
        try {
          LStorage.set('userInfo', res)
        } catch (le) {
          console.error('Error saving to LStorage:', le)
        }
      }
    } else {
      console.error('Invalid user info provided:', res)
    }
  }

  function loginOut() {
    userInfo.value = {
      id: '',
      username: '',
      realname: '',
      avatar: '',
      birthday: '',
      sex: 1,
      email: '',
      phone: '',
      orgCode: '',
      loginTenantId: 0,
      orgCodeTxt: null,
      status: 1,
      delFlag: 0,
      workNo: '',
      post: null,
      telephone: null,
      createBy: null,
      createTime: '',
      updateBy: '',
      updateTime: '',
      activitiSync: 1,
      userIdentity: 2,
      departIds: '',
      relTenantIds: null,
      clientId: null,
      homePath: null,
      postText: null,
      bpmStatus: null,
      izBindThird: false,
      hasAllModelAuth: false,
      projectQuota: 0,
    }
    SStorage.clear()
    LStorage.clear()
  }

  // 从localStorage恢复用户信息
  function restoreUserInfo() {
    try {
      // 首先尝试直接从localStorage获取
      const rawStoredInfo = localStorage.getItem('userInfo')
      let storedUserInfo

      // 如果获取到了原始字符串，尝试解析
      if (rawStoredInfo) {
        console.log('Raw user info from localStorage:', rawStoredInfo)
        // 检查是否是有效的JSON字符串
        if (rawStoredInfo.startsWith('{') && rawStoredInfo.endsWith('}')) {
          try {
            storedUserInfo = JSON.parse(rawStoredInfo)
            console.log('Successfully parsed JSON user info')
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError)
          }
        } else if (rawStoredInfo === '[object Object]') {
          // 处理[object Object]字符串
          console.log('Detected [object Object] string, using backup method')
          // 尝试使用LStorage作为备选
          const lStorageInfo = LStorage.get('userInfo')
          if (lStorageInfo && typeof lStorageInfo === 'object') {
            storedUserInfo = lStorageInfo
          }
        }
      } else {
        // 如果直接localStorage没有，则尝试LStorage
        console.log('No raw user info found, trying LStorage')
        storedUserInfo = LStorage.get('userInfo')
      }

      // 如果成功获取到用户信息
      if (storedUserInfo && typeof storedUserInfo === 'object') {
        console.log('Final stored user info to restore:', storedUserInfo)
        setUserInfo(storedUserInfo)
      } else {
        console.log('No valid user info found in storage')
      }
    } catch (error) {
      console.error('Error restoring user info:', error)
    }
  }

  function setAvatar(avatar: string) {
    userInfo.value.avatar = avatar
  }

  function setThemeConfig(theme: any) {
    themeConfig.value = {...formBgImage, ...theme}
  }

  // 刷新用户信息
  async function refreshUserInfo() {
    try {
      const res: any = await getUserInfo()
      if (res && typeof res === 'object') {
        // 优先使用res.data.userInfo（根据API响应格式）
        if (res.data && res.data.userInfo && typeof res.data.userInfo === 'object') {
          setUserInfo(res.data.userInfo)
        } else if (res.userInfo && typeof res.userInfo === 'object') {
          setUserInfo(res.userInfo)
        } else if (res.data && typeof res.data === 'object') {
          setUserInfo(res.data)
        } else {
          // 最后尝试res本身
          setUserInfo(res)
        }
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error)
    }
  }

  return {
    userId,
    userInfo,
    userName,
    avatar,
    setAvatar,
    setUserInfo,
    loginOut,
    roles,
    permissions,
    hasAllModelAuth,
    mobile,
    email,
    projectQuota,
    formBgImage,
    restoreUserInfo,
    refreshUserInfo,
  }
})
