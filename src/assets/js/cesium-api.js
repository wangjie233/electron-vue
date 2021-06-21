export default {
  Cesium: Cesium,
  minimumZoomDistance: 10,
  maximumZoomDistance: 500,
  initMap: function (dom, { mapUrl, minimumZoomDistance, useDefaultRenderLoop = true }) {
    let imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: mapUrl,
    })
    let terrainProvider = new Cesium.CesiumTerrainProvider({
      url: '/t_dem_tiles'
    })
    let viewer = new Cesium.Viewer(dom, {
      //sceneMode: Cesium.SceneMode.SCENE2D, //地图模式
      showRenderLoopErrors: true, //错误提示
      infoBox: false,
      timeline: false,
      geocoder: false,
      animation: true,
      shouldAnimate: true,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      useDefaultRenderLoop: useDefaultRenderLoop, //自动刷新
      contextOptions: {
        webgl: {
          alpha: true //开启场景透明度
        }
      },
      //加载其他图层
      imageryProvider: imageryProvider,
      //terrainProvider: terrainProvider,
    })
    let scene = viewer.scene

    scene.sun.show = false //隐藏太阳
    scene.moon.show = false //隐藏月亮
    scene.skyBox.show = false //隐藏宇宙
    scene.skyAtmosphere.show = false // 隐藏大气层光圈
    scene.globe.depthTestAgainstTerrain = true // 地形探测
    scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0); //在没有可用图像时获取或设置地球的颜色
    scene.backgroundColor = new Cesium.Color(0, 0, 0, 0) //场景透明
    scene.postProcessStages.fxaa.enabled = true //开启抗锯齿
    // scene.debugShowFramesPerSecond = true // 显示帧率

    /**
     * 设置相机控制器
     */
    //scene.screenSpaceCameraController.minimumZoomDistance = this.minimumZoomDistance //相机的高度的最小值
    //scene.screenSpaceCameraController.maximumZoomDistance = this.maximumZoomDistance //相机高度的最大值
    scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH]
    scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.PINCH]
    scene.screenSpaceCameraController.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG]



    viewer.animation.container.style.visibility = "hidden"; //隐藏时钟
    viewer.cesiumWidget.creditContainer.style.display = 'none' // 去除水印
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK); //取消双击实体锁定
    global.viewer = viewer
    !useDefaultRenderLoop && this.viewerRender()
    this.setMapCurrentTime() //设定当前为北京时间
  },
  viewerRender() {
    window.renderTimer && clearInterval(window.renderTimer)
    window.renderTimer = setInterval(() => {
      if (viewer) {
        viewer.render();
      } else {
        clearInterval(window.renderTimer)
      }
    }, 1000 / 60);
  },
  getCameraHeight() {
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (wheelment) {
      var height = viewer.camera.positionCartographic.height;
    }, Cesium.ScreenSpaceEventType.WHEEL);
  },
  getCameraParameter() {
    var a = {
      position: viewer.camera.position,
      heading: viewer.camera.heading,
      pitch: viewer.camera.pitch,
      roll: viewer.camera.roll
    }
    return a
  },
  /* 设置地图边界 */
  setMapBoundary: function (west, south, east, north) {
    let rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north),
      _this = this
    viewer.camera.setView({
      destination: rectangle
    });


    //开启监听器
    viewer.scene.postRender.addEventListener(getPosition)

    function setPosition(lon, lat, height) {
      viewer.camera.setView({
        destination: _this.lon_lat_to_c3(lon, lat, height),
        orientation: {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll
        }
      })
    }

    function getPosition() {
      let position = viewer.camera.positionCartographic
      let lon = Cesium.Math.toDegrees(position.longitude),
        lat = Cesium.Math.toDegrees(position.latitude),
        height = position.height;
      if (lon <= west) {
        lon = west;
        setPosition(lon, lat, height);
      }
      if (lon >= east) {
        lon = east;
        setPosition(lon, lat, height);
      }
      if (lat <= south) {
        lat = south;
        setPosition(lon, lat, height);
      }
      if (lat >= north) {
        lat = north;
        setPosition(lon, lat, height);
      }
    }
  },
  /* 设置地图中心点 */
  setMapCenter(lon, lat, height = this.maximumZoomDistance) {
    viewer.camera.setView({
      destination: this.lon_lat_to_c3(lon, lat, height),
    })
  },
  flyToSth(position, heading, pitch, roll) {
    viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: heading,
        pitch: pitch,
        roll: roll
      }
    })
  },
  addEntitie(obj = {}) {
    return viewer.entities.add(obj)
  },
  /* 添加图标 */
  addIcon({
    name,
    img,
    position,
    lon = 0,
    lat = 0,
    labelText,
    labelSize = 14,
    labelColor = '#ffffff',
    backgroundColor = '#fc1d26'
  }) {
    return viewer.entities.add({
      name: name,
      position: position || Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: img,
        zIndex: 2
      },
      label: {
        text: labelText || name,
        font: `${labelSize}px sans-serif`,
        fillColor: Cesium.Color.fromCssColorString(labelColor),
        pixelOffset: new Cesium.Cartesian2(0, 25),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString(backgroundColor),
        zIndex: 3
      }
    })
  },
  /* 添加路线 */
  addPolyline({
    id,
    positions = [0, 0, 0, 0],
    lineWidth = 10,
    lineColor = '#ffffff'
  }) {
    let entity = viewer.entities.add({
      id: id,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        width: lineWidth,
        arcType: Cesium.ArcType.GEODESIC,
        material: new Cesium.PolylineArrowMaterialProperty(
          Cesium.Color.fromCssColorString(lineColor)
        ),
        clampToGround: true,
        zIndex: 1
      },
    });
    entity.setPositions = (p) => {
      entity.polyline.positions = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegreesArray(p)
      }, false)
    }
    return entity
  },
  /* 获取鼠标经纬度
    params{
      callBack: 回调,返回参数position:经纬度位置和end:结束时调用
      type:触发方式,click 鼠标点击 | move 鼠标点击时
    }
  */
  getPosition(callBack, type = 'click', ScreenSpaceEventType = Cesium.ScreenSpaceEventType.LEFT_CLICK) {
    let eventType = {
      'click': ScreenSpaceEventType,
      'move': Cesium.ScreenSpaceEventType.MOUSE_MOVE,
    }[type]
    if (!eventType) {
      return
    }

    let canvas = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    canvas.setInputAction((event) => { //按下
      let position = event.position || event.endPosition
      let pick = viewer.scene.pick(position)
      let entity = Cesium.defined(pick) ? pick.id : undefined
      callBack(position, end, entity)
    }, eventType)

    function end() {
      canvas.removeInputAction(eventType)
    }
    return end
  },
  /* 获取地图比例尺 */
  getScale(callBack) {
    var helper = new Cesium.EventHelper();
    helper.add(viewer.scene.globe.tileLoadProgressEvent, function (event) {
      let s = scale()
      s && callBack(s)
    });

    function scale(params) {
      var geodesic = new Cesium.EllipsoidGeodesic();
      var distances = [1, 2, 3,
        5, 10, 20, 30, 50, 100, 200, 300,
        500, 1000, 2000, 3000, 5000, 10000,
        20000, 30000, 50000, 100000, 200000,
        300000, 500000, 1000000, 2000000, 3000000,
        5000000, 10000000, 20000000, 30000000, 50000000
      ];
      // Find the distance between two pixels at the bottom center of the screen.
      let scene = viewer.scene;
      let width = scene.canvas.clientWidth;
      let height = scene.canvas.clientHeight;
      let left = scene.camera.getPickRay(new Cesium.Cartesian2((width / 2) | 0, height - 1));
      let right = scene.camera.getPickRay(new Cesium.Cartesian2((1 + width / 2) | 0, height - 1));
      let globe = scene.globe;
      let leftPosition = globe.pick(left, scene);
      let rightPosition = globe.pick(right, scene);
      if (!Cesium.defined(leftPosition) || !Cesium.defined(rightPosition)) {
        return;
      }
      let leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
      let rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);
      geodesic.setEndPoints(leftCartographic, rightCartographic);
      let pixelDistance = geodesic.surfaceDistance;
      // Find the first distance that makes the scale bar less than 100 pixels.
      let maxBarWidth = 100;
      let distance;
      for (let i = distances.length - 1; !Cesium.defined(distance) && i >= 0; --i) {
        if (distances[i] / pixelDistance < maxBarWidth) {
          distance = distances[i];
        }
      }
      if (Cesium.defined(distance)) {
        var label = distance >= 1000 ? (distance / 1000).toString() + " km" : distance.toString() + " m";
        var barWidth = (distance / pixelDistance) | 0;
        return {
          width: barWidth,
          label: label
        }
      }
    }
  },
  /* 获取路径点
    pathArr:要追加路径的数组，
    callBack:鼠标又键结束时返回pathArr
  */
  getPath({
    showLine = true,
    pathArr = [],
    callBack,
    selectCallBack
  }) {
    console.log('开启路径选择')
    let canvas = new Cesium.ScreenSpaceEventHandler(viewer.canvas),
      _this = this
    let pathLine = showLine && new _this.pathLine(pathArr)
    canvas.setInputAction(select, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    canvas.setInputAction(end, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    function select(event) {
      let c3 = _this.c2_to_c3(event.position)
      c3 && pathArr.push(c3)
      pathLine && pathLine.add(c3)
      selectCallBack && selectCallBack(c3)
    }

    function end(event) {
      callBack && callBack(pathArr)
      canvas.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
      canvas.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
      pathLine && pathLine.remove()
      console.log('路径选择结束')
    }
    return pathLine
  },
  /* 创建一条路径线
    pathArr：要创建的c3路径数组
  */
  pathLine: function (pathArr = []) {
    pathArr = JSON.parse(JSON.stringify(pathArr))
    let entitiesArr = [],
      scene = viewer.scene
    let entitie = viewer.entities.add({
      polyline: {
        width: 3,
        clampToGround: true,
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
        positions: pathArr,
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.RED,
          outlineWidth: 0,
          outlineColor: Cesium.Color.ORANGE
        })
      }
    })
    let pathLine = entitie.polyline
    entitiesArr.push(entitie)
    pathArr.forEach(addPathPoint)

    function addPathPoint(c3) {
      let entitie = viewer.entities.add({
        position: c3,
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0
        },
        point: {
          color: Cesium.Color.YELLOW,
          pixelSize: 10,
          //distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 500)
          //disableDepthTestDistance: 500
        }
      })
      let position = entitie.position.getValue(viewer.clock.currentTime);
      entitie.position = viewer.scene.clampToHeight(position, [entitie]);
      entitiesArr.push(entitie)
    }
    this.add = function (c3) {
      pathArr.push(c3)
      pathLine.positions = new Cesium.CallbackProperty(() => {
        return pathArr
      }, false)
      addPathPoint(c3)
    }
    this.remove = function () {
      entitiesArr.forEach(entitie => {
        viewer.entities.remove(entitie)
      })
    }
    this.entities = entitiesArr
  },
  // 测距
  getRanging() {
    let _this = this
    let pathLine = this.getPath({
      callBack: arr => {
        calc(arr)
        deleteLine()
      }
    })

    function calc(arr) {
      let count = 0,
        scratch = new Cesium.Cartographic()
      for (let i = 0; i < arr.length - 1; i++) {
        let p = Cesium.Cartographic.fromCartesian(arr[i]),
          np = Cesium.Cartographic.fromCartesian(arr[i + 1]),
          lp = new Cesium.EllipsoidGeodesic(p, np)
        let lon_lat = lp.interpolateUsingFraction(0.5, scratch)
        let ranging = lp.surfaceDistance
        addLabel(lon_lat, ranging)
        count += ranging
      }
    }

    function addLabel(lon_lat, text) {
      let label = viewer.entities.add({
        position: Cesium.Cartesian3.fromRadians(
          lon_lat.longitude,
          lon_lat.latitude,
          //viewer.scene.sampleHeight(lon_lat)
        ),
        label: {
          text: `${text.toFixed(1)}m`,
          font: '14px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, 20),
          //distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 500),
          //disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      pathLine.entities.push(label)
    }

    function deleteLine(params) {
      let canvas = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
      canvas.setInputAction(remove, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      function remove(event) {
        let pick = scene.pick(event.position)
        let entity = Cesium.defined(pick) && pick.id
        pathLine.entities.indexOf(entity) > -1 && pathLine.remove()
        canvas.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
      }
    }
  },

  /* 实体操作 */
  getEntityById(id) {
    return viewer.entities.getById(id)
  },

  getEntityByC2(c2) {
    let pick = viewer.scene.pick(c2)
    let entity = Cesium.defined(pick) && pick.id
    if (entity) {
      return entity
    }
  },

  removeEntity(id) {
    let entity = this.getEntityById(id)
    return viewer.entities.remove(entity);
  },
  /* 坐标转换 */
  c2_to_c3(c2) {
    return viewer.scene.pickPosition(c2)
    //let c3 = viewer.scene.globe.pick(viewer.camera.getPickRay(c2), viewer.scene)
    //return viewer.camera.pickEllipsoid(c2, viewer.scene.globe.ellipsoid);
  },
  c3_to_lon_lat(c3) {
    if (!c3) { return }
    let lon_lat = Cesium.Cartographic.fromCartesian(c3)
    lon_lat.longitude = Cesium.Math.toDegrees(lon_lat.longitude)
    lon_lat.latitude = Cesium.Math.toDegrees(lon_lat.latitude)
    lon_lat.height = Math.round(lon_lat.height * 100) / 100
    return lon_lat
  },
  c2_to_lon_lat(c2) {
    return this.c3_to_lon_lat(this.c2_to_c3(c2))
  },
  lon_lat_to_c3(longitude, latitude, height, ellipsoid, result) {
    return Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result)
  },
  lon_lat_Offset(lonlat, brng = 0, dist = 500) {
    /*
     * 度换成弧度
     * @param  {Float} d  度
     * @return {[Float}   弧度
    */
    let rad = function (d) {
      return d * Math.PI / 180.0;
    }

    /*
     * 弧度换成度
     * @param  {Float} x 弧度
     * @return {Float}   度
    */
    let deg = function (x) {
      return x * 180 / Math.PI;
    }
    var ct = { a: 6378137, b: 6356752.3142, f: 1 / 298.257223563 };
    var a = ct.a, b = ct.b, f = ct.f;

    var lon1 = lonlat.lon * 1;  //乘一（*1）是为了确保经纬度的数据类型为number
    var lat1 = lonlat.lat * 1;

    var s = dist;
    var alpha1 = rad(brng);
    var sinAlpha1 = Math.sin(alpha1);
    var cosAlpha1 = Math.cos(alpha1);

    var tanU1 = (1 - f) * Math.tan(rad(lat1));
    var cosU1 = 1 / Math.sqrt((1 + tanU1 * tanU1)), sinU1 = tanU1 * cosU1;
    var sigma1 = Math.atan2(tanU1, cosAlpha1);
    var sinAlpha = cosU1 * sinAlpha1;
    var cosSqAlpha = 1 - sinAlpha * sinAlpha;
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b);
    var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
    var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));

    var sigma = s / (b * A), sigmaP = 2 * Math.PI;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
      var cos2SigmaM = Math.cos(2 * sigma1 + sigma);
      var sinSigma = Math.sin(sigma);
      var cosSigma = Math.cos(sigma);
      var deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
        B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      sigmaP = sigma;
      sigma = s / (b * A) + deltaSigma;
    }

    var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
    var lat2 = Math.atan2(sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
      (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp));
    var lambda = Math.atan2(sinSigma * sinAlpha1, cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1);
    var C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    var L = lambda - (1 - C) * f * sinAlpha *
      (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    var revAz = Math.atan2(sinAlpha, -tmp);  // final bearing
    var lon_destina = lon1 * 1 + deg(L);
    return [lon_destina, deg(lat2)];
  },
  c3_to_Offset(c3Arr, offset = 100) {
    let p = []
    c3Arr.forEach(item => {
      let lon_lat = this.c3_to_lon_lat(item)
      p.push(lon_lat.longitude)
      p.push(lon_lat.latitude)
    });
    let radians = Cesium.Math.toDegrees(Math.atan2(p[2] - p[0], p[3] - p[1]))
    let fromP = this.lon_lat_Offset({ lon: p[0], lat: p[1] }, radians, offset)
    let toP = this.lon_lat_Offset({ lon: p[2], lat: p[3] }, radians + 180, offset)
    return Cesium.Cartesian3.fromDegreesArray([...fromP, ...toP])
  },
  /* 坐标转换end */
  /* 设定地图当前时间 */
  setMapCurrentTime(time = new Date()) {
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(time);
  },

  loadGeoJson(jsonPath) {
    let promise = Cesium.GeoJsonDataSource.load(jsonPath)
    promise.then(dataSource => {
      viewer.dataSources.add(dataSource)
      let entities = dataSource.entities.values
      console.log("entities", entities)
      for (let item in entities) {
        entities[item].label = {
          text: entities[item].name,
          font: 'normal 15px MicroSoft YaHei'
        }
      }
    }).otherwise(error => {
      console.error(error)
    })
  },

  addMark(markInfo) {
    if (markInfo.modelLabel == '') {
      viewer.entities.add({
        id: markInfo.id,
        name: markInfo.modelLabel,
        position: Cesium.Cartesian3.fromDegrees(markInfo.lng, markInfo.lat),
        label: {
          text: markInfo.modelLabel,
        }
      })
    } else {
      viewer.entities.add({
        id: markInfo.id,
        name: markInfo.modelLabel,
        position: Cesium.Cartesian3.fromDegrees(markInfo.lng, markInfo.lat),
        billboard: {
          image: '/static/img/mark.png',
          show: true, // default
          width: 50, // default: undefined
          height: 50 // default: undefined
        },
        label: {
          text: markInfo.modelLabel,
          font: '16px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, -25),
          fillColor: Cesium.Color.fromCssColorString('#00f7ff')
        }
      })
    }
  },
  flyToVerticalCamera() {
    console.log(viewer.camera.position);
    console.log('pitch',viewer.camera.pitch);
    viewer.camera.flyTo({
      duration: 1,
      destination: viewer.camera.position,
      orientation: {
        heading: viewer.camera.heading,
        pitch: Cesium.Math.toRadians(-90),
        roll: viewer.camera.roll
      }
    })
  },
  flyToMaxZoom(callback) {
    let lon_lat = viewer.camera.positionCartographic
    lon_lat.height = this.maximumZoomDistance
    let destination = Cesium.Cartesian3.fromRadians(lon_lat.longitude, lon_lat.latitude, lon_lat.height)
    viewer.camera.flyTo({
      duration: 1,
      destination: destination,
      complete: callback
    })
  },
  flyToEntity(element, camearHeight, callback) {
    let entity = this.getEntityById(element.id)
    entity.position = Cesium.Cartesian3.fromDegrees(element.lng, element.lat, camearHeight)
    let flyToPromise = viewer.flyTo(entity, {
      duration: 1
    })
    flyToPromise.then(function (flyToPromise) {
      if (flyToPromise) {
        callback && callback()
      }
    }).otherwise(error => {
      console.error(error)
    })
  },
  addHighlightPolygonGeometry(polygonInfo, polygonColor, callback) {
    let linePosition = polygonInfo.position.concat(polygonInfo.position[0], polygonInfo.position[1]) //闭合曲线
    let areaEntity = viewer.entities.add({
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(polygonInfo.position),
        material: Cesium.Color.fromCssColorString(polygonColor),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILES,
      },
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(linePosition),
        material: Cesium.Color.fromCssColorString(polygonColor),
        classificationType: Cesium.ClassificationType.CESIUM_3D_TILES,
        clampToGround: true,
        width: 5,
        show: false
      },
      name: polygonInfo.name,
      id: polygonInfo.id,
    })
    callback(areaEntity)
  }
}
