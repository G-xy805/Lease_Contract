/**
 * signature-pad 手写签名板组件
 * 基于 Canvas 2D API 实现手写签名功能
 * 支持清除、撤销、确认输出Base64
 */

Component({
  properties: {
    width: {
      type: Number,
      value: 650
    },
    height: {
      type: Number,
      value: 300
    },
    lineWidth: {
      type: Number,
      value: 3
    },
    lineColor: {
      type: String,
      value: '#000000'
    }
  },

  data: {
    canvasWidth: 0,
    canvasHeight: 0
  },

  lifetimes: {
    attached() {
      // 初始化数据
      this.strokes = [];           // 存储所有笔画
      .currentStroke = null;       // 当前正在绘制的笔画
      this.isDrawing = false;      // 是否正在绘制
      this.ctx = null;             // Canvas 2D 上下文
      this.canvas = null;          // Canvas 元素
    },

    ready() {
      this.initCanvas();
    }
  },

  methods: {
    /**
     * 初始化 Canvas
     */
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#signatureCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            this.canvas = res[0].node;
            this.ctx = this.canvas.getContext('2d');

            const dpr = wx.getSystemInfoSync().pixelRatio;
            this.canvas.width = res[0].width * dpr;
            this.canvas.height = res[0].height * dpr;

            this.ctx.scale(dpr, dpr);

            // 设置画布样式
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.lineWidth = this.properties.lineWidth;
            this.ctx.strokeStyle = this.properties.lineColor;

            this.setData({
              canvasWidth: res[0].width,
              canvasHeight: res[0].height
            });
          }
        });
    },

    /**
     * 触摸开始事件
     */
    onTouchStart(e) {
      if (!this.ctx) return;

      this.isDrawing = true;
      const point = {
        x: e.touches[0].x,
        y: e.touches[0].y
      };

      // 开始新笔画
      this.currentStroke = [point];
      this.strokes.push(this.currentStroke);

      // 移动画笔到起始点
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
    },

    /**
     * 触摸移动事件
     */
    onTouchMove(e) {
      if (!this.isDrawing || !this.ctx || !this.currentStroke) return;

      const point = {
        x: e.touches[0].x,
        y: e.touches[0].y
      };

      // 添加点到当前笔画
      this.currentStroke.push(point);

      // 绘制线条（使用二次贝塞尔曲线使线条更平滑）
      const points = this.currentStroke;
      if (points.length >= 2) {
        const prev = points[points.length - 2];
        const curr = points[points.length - 1];

        this.ctx.lineWidth = this.properties.lineWidth;
        this.ctx.strokeStyle = this.properties.lineColor;

        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;

        this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        this.ctx.stroke();
      }
    },

    /**
     * 触摸结束事件
     */
    onTouchEnd() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.currentStroke = null;
    },

    /**
     * 清空画布
     * 暴露给父组件调用
     */
    clear() {
      if (!this.ctx || !this.canvas) return;

      // 清除画布
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 清空笔画历史
      this.strokes = [];
      this.currentStroke = null;
    },

    /**
     * 撤销上一笔
     * 暴露给父组件调用
     */
    undo() {
      if (!this.ctx || !this.canvas || this.strokes.length === 0) return;

      // 移除最后一笔
      this.strokes.pop();

      // 重绘画布
      this.redrawCanvas();
    },

    /**
     * 重绘整个画布
     */
    redrawCanvas() {
      if (!this.ctx || !this.canvas) return;

      // 清除画布
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 重绘所有笔画
      this.strokes.forEach(stroke => {
        if (stroke.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(stroke[0].x, stroke[0].y);

        for (let i = 1; i < stroke.length; i++) {
          const prev = stroke[i - 1];
          const curr = stroke[i];

          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;

          this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }

        this.ctx.lineWidth = this.properties.lineWidth;
        this.ctx.strokeStyle = this.properties.lineColor;
        this.ctx.stroke();
      });
    },

    /**
     * 获取签名数据（Base64格式）
     * 返回 Promise，解析后得到 Base64 字符串
     * 暴露给父组件调用
     */
    getSignatureData() {
      return new Promise((resolve, reject) => {
        if (!this.canvas) {
          reject(new Error('Canvas 未初始化'));
          return;
        }

        // 将 canvas 导出为临时文件
        wx.canvasToTempFilePath({
          canvas: this.canvas,
          fileType: 'png',
          quality: 1,
          success: (res) => {
            // 读取临时文件并转换为 Base64
            wx.getFileSystemManager().readFile({
              filePath: res.tempFilePath,
              encoding: 'base64',
              success: (readRes) => {
                const base64 = `data:image/png;base64,${readRes.data}`;
                resolve(base64);
              },
              fail: (err) => {
                reject(err);
              }
            });
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },

    /**
     * 获取签名的临时文件路径
     * 返回 Promise
     */
    getSignatureTempPath() {
      return new Promise((resolve, reject) => {
        if (!this.canvas) {
          reject(new Error('Canvas 未初始化'));
          return;
        }

        wx.canvasToTempFilePath({
          canvas: this.canvas,
          fileType: 'png',
          quality: 1,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    },

    /**
     * 判断画布是否为空
     * 暴露给父组件调用
     */
    isEmpty() {
      return this.strokes.length === 0;
    },

    /**
     * 确认签名并触发事件
     */
    onConfirm() {
      this.getSignatureData()
        .then((base64Data) => {
          this.triggerEvent('confirm', { signatureData: base64Data });
        })
        .catch((err) => {
          console.error('获取签名数据失败:', err);
          wx.showToast({
            title: '获取签名失败',
            icon: 'none'
          });
        });
    },

    /**
     * 取消签名并触发事件
     */
    onCancel() {
      this.triggerEvent('cancel');
    }
  }
});
