<template>
  <el-menu
    :router="true"
    :default-active="$route.path"
    @open="handleOpen"
    @close="handleClose"
  >
    <el-menu-item index="/home">
      <i class="el-icon-menu"></i>
      <template #title>主页</template>
    </el-menu-item>
    <el-menu-item index="/audioContext">
      <i class="el-icon-headset"></i>
      <template #title>audioContext</template>
    </el-menu-item>
  </el-menu>
</template>
<script type="text/javascript">
export default {
  name: "Menu",
  data() {
    return {};
  },
  computed: {},
  mounted() {},
  methods: {
    handleOpen(key, keyPath) {
      console.log(key, keyPath);
    },
    handleClose(key, keyPath) {
      console.log(key, keyPath);
    },
  },
  components: {},
};
</script>

<style lang="scss" scoped>
</style>
