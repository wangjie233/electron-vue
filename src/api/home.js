import { get } from './index.js'
export default {
  getLocation(){
    return get('/baidu/?qt=ipLocation')
  }
}