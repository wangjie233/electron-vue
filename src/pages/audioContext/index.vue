<template>
  <div class="audio-content-wrap">
    <input type="file" name="" id="fileBox" @change="openLocalFile" />
    <div>
      <input
        type="range"
        min="0"
        :max="durationTime"
        v-model="currentTime"
        @mousedown="isProgressChange = true"
        @mouseup="isProgressChange = false"
        @change="progressChange"
      />
      <span>{{ `${formatCurrentTime}/${formatDurationTime}` }}</span>
    </div>
    <div>
      <span>音量:</span>
      <input
        type="range"
        min="0"
        :max="100"
        v-model="volume"
        @input="volumeChange"
      />
    </div>
    <div>
      <input type="button" value="停止" @click="stop" />
      <input type="button" value="上一曲" @click="last" />
      <span>
        <input type="button" v-if="isPlay" value="暂停" @click="suspend" />
        <input type="button" v-else value="播放" @click="resume" />
      </span>
      <input type="button" value="下一曲" @click="next" />
      <select v-model="playType">
        <option :key="t" :value="t" v-for="(type, t) in playTypeObj">
          {{ type }}
        </option>
      </select>
    </div>
    <ul class="music-list">
      <li
        class="music-item"
        :class="{ 'on-play': playIndex === i }"
        :key="i"
        @click="playIndex = i"
        v-for="(music, i) in musicList"
      >
        {{ music.name }}
      </li>
    </ul>
  </div>
</template>

<script>
import api from "@api/audioContext.js";
export default {
  name: "audioContext",
  props: {},
  data() {
    return {
      context: null,
      gain: null,
      source: null,
      buffer: null,
      durationTime: 0,
      currentTime: 0,
      isPlay: false,
      volume: 50,
      playIndex: 0,
      playType: "list",
      playTypeObj: {
        list: "列表循环",
        single: "单曲循环",
        random: "随机播放",
      },
      playerTimer: null,
      progressOffset: 0,
      isProgressChange: false,
      musicList: [
        {
          name: "青花瓷",
          src: "qinghuaci.mp3",
        },
        {
          name: "夜曲",
          src: "yequ.mp3",
        },
        {
          name: "青花瓷",
          src: "qinghuaci.mp3",
        },
        {
          name: "夜曲",
          src: "yequ.mp3",
        },
        {
          name: "青花瓷",
          src: "qinghuaci.mp3",
        },
        {
          name: "夜曲",
          src: "yequ.mp3",
        },
      ],
    };
  },
  computed: {
    formatDurationTime() {
      let { durationTime } = this, minute = 0, second = 0;
      minute = Math.floor(durationTime / 60).toString().padStart(2,"0");
      second = Math.floor(durationTime % 60).toString().padStart(2,"0");
      return `${minute}:${second}`;
    },
    formatCurrentTime() {
      let { currentTime } = this, minute = 0, second = 0;
      minute = Math.floor(currentTime / 60).toString().padStart(2,"0");
      second = Math.floor(currentTime % 60).toString().padStart(2,"0");
      return `${minute}:${second}`;
    },
  },
  mounted() {},
  beforeUnmount(){
    this.stop();
  },
  methods: {
    resetPlayerParameter() {
      this.isPlay = false;
      this.playerTimer = null;
      this.currentTime = this.progressOffset = 0;
    },
    getMusicFile() {
      let music = this.musicList[this.playIndex];
      let src = music && music.src;
      src && api.getMusicFile(src).then((result) => {
        this.decodeData(result);
      });
    },
    openLocalFile(data) {
      let file = data.target.files[0];
      if (!file) {
        return;
      }
      let fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onprogress = (e) => {
        console.log(`音频读取中(${(e.loaded / e.total) * 100}%)...`);
      };
      fileReader.onload = (e) => {
        let result = e.target.result;
        this.decodeData(result);
      };
    },
    createAudioContext() {
      this.context && this.context.state != "closed" && this.context.close();
      let context = new AudioContext(),
        lastState = "";
      context.suspend();
      context.onstatechange = (e) => {
        let state = e.target.state;
        if (state === lastState) {
          return;
        }
        lastState = state;
        console.log(`播放器状态:${state}...`);
        if (state === "running") {
          this.setPlayerTimer();
        } else {
          this.clearPlayerTimer();
        }
        if (state === "closed") {
          this.resetPlayerParameter();
        }
      };
      this.context = context;
      return context;
    },
    decodeData(result) {
      //解码
      let context = this.createAudioContext();
      context.decodeAudioData(
        result,
        (buffer) => {
          this.buffer = buffer;
          this.createBufferSource();
          this.resume();
        },
        function (e) {
          console.log(e);
        }
      );
    },
    createGain() {
      let { context, volume ,gain } = this;
      gain && gain.disconnect(context.destination);
      gain = context.createGain();
      gain.gain.value = volume / 100;
      gain.connect(context.destination);
      this.gain = gain;
      return gain;
    },
    createBufferSource() {
      let { context, buffer, currentTime} = this;
      let source = context.createBufferSource(); // 创建一个声音源
      source.buffer = buffer; // 告诉该源播放什么音频
      source.connect(this.createGain());
      source.onended = () => {
        // console.log("音频源播放完毕...");
        this.stop();
        this.next();
      };
      this.source = source;
      this.durationTime = buffer.duration;
      source.start(0, currentTime);
      // console.log("音频源准备完毕...");
    },
    setPlayerTimer() {
      let { context } = this;
      this.clearPlayerTimer();
      let run = () => {
        this.playerTimer = requestAnimationFrame(run);
        if (!this.isProgressChange) {
          //console.log(context.currentTime);
          this.currentTime = context.currentTime + this.progressOffset;
        }
      };
      run();
    },
    clearPlayerTimer() {
      this.playerTimer && cancelAnimationFrame(this.playerTimer);
    },
    volumeChange(e) {
      let { gain } = this;
      if (gain) {
        let volume = e.target.valueAsNumber;
        gain.gain.value = volume / 100;
      }
    },
    progressChange(e) {
      let { context } = this;
      let value = e.target.valueAsNumber;
      this.progressOffset = value - context.currentTime;
      this.createBufferSource();
    },
    resume() {
      let { context } = this;
      if (!context || context.state === "closed") {
        this.getMusicFile();
        return;
      }
      context.resume();
      this.isPlay = true;
    },
    suspend() {
      let { context } = this;
      context && context.suspend();
      this.isPlay = false;
    },
    stop() {
      let { context } = this;
      context && context.close();
    },
    last() {
      let index = this.playIndex - 1,
        len = this.musicList.length;
      if (index < 0) {
        this.playIndex = len - 1 < 0 ? 0 : len - 1;
      } else {
        this.playIndex = index;
      }
      this.getMusicFile()
    },
    next() {
      let { playIndex, musicList, playType } = this;
      let playTypeObj = {
        list: () => {
          let index = playIndex + 1, len = musicList.length;
          return index < len ? index : 0
        },
        single: () => {
          return playIndex
        },
        random: () => {
          let index = getRandomForRange(0, musicList.length - 1);
          return playIndex === index ? playTypeObj['random']() : index;
        },
      };
      this.playIndex = playTypeObj[playType]();
      this.getMusicFile();
    },
  },
  watch: {
  },
  components: {},
};
</script>
<style lang="scss" scoped>
.music-list {
  width: 200px;
  height: 252px;
  overflow-y: auto;
  overflow-x: hidden;
  .music-item {
    cursor: pointer;
    padding: 10px 0;
    text-align: center;
    border-bottom: 1px solid #cfcfcf;
    &.on-play {
      background-color: aqua;
    }
  }
}
</style>