// audioManager.js
class AudioVisualizer {
  constructor() {
    this.analyser = null;
    this.dataArray = null;
    this.isPlaying = false;
    this.audioContext = null;
    this.source = null;
    this.beatValue = 0; // 节拍强度
    this.smoothBeat = 0; // 用于衔接静止和律动的平滑值
    this.setupEventListeners();
  }

  async init(url) {
    if (this.audioContext) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.loop = true;

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; 
      this.analyser.smoothingTimeConstant = 0.8; // 增加平滑度，让扩散更自然

      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.source.start(0);
      this.isPlaying = true;
    } catch (e) {
      console.error("音频初始化失败:", e);
    }
  }

  async toggle() {
    if (!this.audioContext) {
      await this.init("./bg.mp3");
      return "暂停";
    }

    if (this.audioContext.state === 'running') {
      await this.audioContext.suspend();
      this.isPlaying = false;
      return "音乐";
    } else if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      this.isPlaying = true;
      return "暂停";
    }
  }

  setupEventListeners() {
    const btn = document.createElement("div");
    btn.innerHTML = "音乐";
    btn.style.cssText = "position:fixed; top:20px; right:20px; color:white; background:rgba(242,190,69,0.5); padding:10px 20px; border:1px solid #f2be45; cursor:pointer; font-family:sans-serif; z-index:1000; border-radius:20px; transition: all 0.3s;";
    document.body.appendChild(btn);

    btn.addEventListener("click", async () => {
      const label = await this.toggle();
      if (label) btn.innerHTML = label;
    });
  }

  // 获取节拍强度 (0.0 - 1.0)
  getBeatValue() {
    let targetBeat = 0;
    
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // 我们主要检测低音部分（节拍通常在低频）
      let sum = 0;
      const analyzeRange = 10; // 只看前10个频段（低音区）
      for (let i = 0; i < analyzeRange; i++) {
          sum += this.dataArray[i];
      }
      targetBeat = (sum / analyzeRange) / 255.0;
    }
    
    // 线性插值 (Lerp) 实现平滑衔接
    // 当 targetBeat 变为 0 (暂停时)，smoothBeat 会缓慢降向 0，而不是瞬间消失
    const lerpFactor = 0.1; 
    this.smoothBeat += (targetBeat - this.smoothBeat) * lerpFactor;
    
    return this.smoothBeat;
  }
}

export const audioManager = new AudioVisualizer();