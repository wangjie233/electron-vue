import {getArraybuffer} from './index.js'
export default {
  getMusicFile(fileName){
    return getArraybuffer('/public/' + fileName)
  }
}