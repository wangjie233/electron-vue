import axios from 'axios'
// axios 配置
axios.defaults.timeout = 10000
axios.defaults.baseURL = import.meta.env.VITE_API_ORIGIN
axios.defaults.withCredentials = true; //携带cookie等信息
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
// axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
// 添加请求拦截器
axios.interceptors.request.use(config => {
  // 在发送请求之前做些什么
  //判断是否存在token，如果存在将每个页面header都添加token
  //if (store.state.token) {
  //config.headers.common['Authentication-Token'] = 'token'//store.state.token
  //}
  return config
}, error => {
  // 对请求错误做些什么
  return Promise.reject(error)
})
// 添加响应拦截器
axios.interceptors.response.use(res => {
  return res
}, error => {
  return Promise.reject(error)
})
export function post(url, params) {
  return new Promise((resolve, reject) => {
    axios.post(url, params).then(response => {
      let json = response.data
      resolve(json)
    }).catch((error) => {
      resolve(error)
    })
  })
}
export function get(url, params ) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params: params,
    }).then(response => {
      let json = response.data
      resolve(json)
    }).catch((error) => {
      resolve(error)
    })
  })
}

export function getArraybuffer(url, params ) {
  return new Promise((resolve, reject) => {
    axios.get(url, {
      params: params,
      responseType:'arraybuffer'
    }).then(response => {
      let json = response.data
      resolve(json)
    }).catch((error) => {
      resolve(error)
    })
  })
}