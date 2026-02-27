import {useStorage} from '@vueuse/core'
import {userStore} from '@/store/user'

enum StorageType {
  l = 'localStorage',
  s = 'sessionStorage',
}

export enum StorageKey {
  EditorInfo = 'editorInfo',
  EditorEnInfo = 'editorEnInfo',
  MultilingualTranslation = 'multilingualTranslation',
  MultilingualList = 'multilingualList',
  AllLanguageList = 'allLanguageList',
}

class MyStorage {
  storage: Storage

  constructor(type: StorageType) {
    this.storage = type === StorageType.l ? window.localStorage : window.sessionStorage
  }

  set(key: string, value: any) {
    this.storage.setItem(key, value)
  }

  get<T>(key: string): T | null {
    const value = this.storage.getItem(key)
    if (value && value != 'undefined' && value != null) {
      return <T>value
    }
    return null
  }

  delete(key: string) {
    this.storage.removeItem(key)
  }

  clear() {
    this.storage.clear()
  }
}

const LStorage = new MyStorage(StorageType.l)
const SStorage = new MyStorage(StorageType.s)
export const getToken = () => {
  return LStorage.get<string>('access_token')
}
export const setToken = (token: string) => {
  LStorage.set('access_token', token)
}

export const setEditorPermission = (value: string) => {
  LStorage.set('editor_permission', value)
}

export const getEditorPermission = (value: string) => {
  LStorage.set('editor_permission', value)
}

export const setGlobalCopySnapshot = (value: string) => {
  LStorage.set('global_copy_snapshot', value)
}

export const getGlobalCopySnapshot = () => {
  return LStorage.get<string>('global_copy_snapshot')
}

export const setImageListSort = (value: string) => {
  LStorage.set(userStore().userId + '_image_list_sort', value)
}

export const getImageListSort = () => {
  return LStorage.get<string>(userStore().userId + '_image_list_sort') ?? '1'
}

export const setIconListSort = (value: string) => {
  LStorage.set(userStore().userId + '_icon_list_sort', value)
}

export const getIconListSort = () => {
  return LStorage.get<string>(userStore().userId + '_icon_list_sort') ?? '1'
}

export {LStorage, SStorage}
