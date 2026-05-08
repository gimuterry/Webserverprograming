const UIHandler = {
    audioCtx: null,
    analyser: null,
    microphone: null,
    javascriptNode: null,
    animationId: null,

    openSettings() {
        document.getElementById('settings-modal').style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        this.startMicVisualizer();
        this.initVolumeControls(); // 볼륨 조절 이벤트 연결
    },

    closeSettings() {
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('modal-overlay').style.display = 'none';
        
        // 자원 해제 (메모리 관리)
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    },

    initVolumeControls() {
        // 1. 스피커 음량 (0.0 ~ 1.0)
        const outputSlider = document.getElementById('output-volume');
        outputSlider.oninput = (e) => {
            const volume = e.target.value;
            document.querySelectorAll('audio').forEach(audio => {
                audio.volume = volume;
            });
        };

        // 2. 마이크 감도 (0.0 ~ 2.0배 증폭)
        const inputSlider = document.getElementById('input-sensitivity');
        inputSlider.oninput = (e) => {
            if (VoiceHandler.gainNode) {
                // 슬라이더 0.5가 1.0배(기본), 1.0이 2.0배(증폭)가 되도록 계산
                const multiplier = e.target.value * 2;
                VoiceHandler.gainNode.gain.value = multiplier;
            }
        };
    },

    startMicVisualizer() {
        if (!currentStream) return;

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        const source = this.audioCtx.createMediaStreamSource(currentStream);
        
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
            if (document.getElementById('settings-modal').style.display === 'none') return;
            
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            let average = sum / bufferLength;
            
            // 막대그래프 업데이트 (평균값에 증폭률 1.5배 적용해서 더 역동적이게)
            const bar = document.getElementById('mic-bar');
            if (bar) {
                bar.style.width = Math.min(average * 1.5, 100) + "%";
                // 소리가 크면 색상 변경 (피크 미터 느낌)
                bar.style.background = average > 50 ? '#ff4d4d' : '#28a745';
            }
            
            this.animationId = requestAnimationFrame(update.bind(this));
        };
        update();
    }
};