<template>
  <div class="index-wrap flex-col">
    <Header></Header>
    <div class="body-wrap flex-row flex-1">
      <div class="body-menu-wrap">
        <Menu></Menu>
      </div>
      <div class="body-content-wrap flex-1">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import Header from "@/components/header/index.vue";
import Menu from "@/components/menu/index.vue";
export default {
  name: "index",
  props: {},
  data() {
    return {};
  },
  mounted() {},
  methods: {},
  components: {
    Header,
    Menu,
  },
};
</script>
<style lang="scss" scoped>
.index-wrap {
  width: 100vw;
  height: 100vh;
  .body-wrap {
    overflow: hidden;
    .body-menu-wrap {
      width: 300px;
      overflow: auto;
    }
    .body-content-wrap {
      padding: 15px;
      overflow: auto;
    }
  }
}
</style>
