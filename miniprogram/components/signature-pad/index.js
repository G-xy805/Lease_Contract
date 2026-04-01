Component({
  properties: {
    width: {
      type: String,
      value: '100%'
    },
    height: {
      type: Number,
      value: 300
    },
    lineColor: {
      type: String,
      value: '#000000'
    },
    lineWidth: {
      type: Number,
      value: 2
    }
  },

  data: {
    canvasId: '',
    isDrawing: false,
    points: []
  },

  lifetimes: {
    attached() {
      const randomId = Math.random().toString(36).substr(2, 9)
      this.canvasId = `signature_canvas_${this.id || randomId}`
      this.ctx = wx.createCanvasContext(this.canvasId, this)
    }
  },

  methods: {
    onTouchStart(e) {
      const points = e.touches;
      if (points.length > 0) {
        const point = points[0];
        this.setData({
          isDrawing: true,
          points: [{ x: point.x, y: point.y }]
        });
        this.ctx.moveTo(point.x, point.y);
        this.triggerEvent('start');
      }
    },

    onTouchMove(e) {
      if (!this.data.isDrawing) return;
      const points = e.touches;
      if (points.length > 0) {
        const point = points[0];
        const currentPoints = this.data.points.concat([{ x: point.x, y: point.y }]);
        this.drawLine(currentPoints);
        this.setData({ points: currentPoints });
      }
    },

    onTouchEnd(e) {
      if (this.data.isDrawing) {
        this.setData({ isDrawing: false });
        this.triggerEvent('end');
      }
    },

    drawLine(points) {
      if (points.length < 2) return;
      this.ctx.setStrokeStyle(this.properties.lineColor);
      this.ctx.setLineWidth(this.properties.lineWidth);
      this.ctx.setLineCap('round');
      this.ctx.setLineJoin('round');
      this.ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) {
          this.ctx.moveTo(points[i].x, points[i].y);
        } else {
          const prev = points[i - 1];
          const curr = points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          this.ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
      }
      this.ctx.stroke();
      this.ctx.draw();
    },

    getSignature() {
      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvasId: this.canvasId,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            reject(err);
          }
        }, this);
      });
    },

    getSignatureBase64() {
      return new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvasId: this.canvasId,
          fileType: 'png',
          success: (res) => {
            wx.getFileSystemManager().readFile({
              filePath: res.tempFilePath,
              encoding: 'base64',
              success: (readRes) => {
                resolve(`data:image/png;base64,${readRes.data}`);
              },
              fail: reject
            });
          },
          fail: reject
        }, this);
      });
    },

    clear() {
      this.ctx.clearRect(0, 0, this.properties.width, this.properties.height);
      this.ctx.draw();
      this.setData({ points: [] });
    }
  }
});