// public/js/voice-handler.js

const VoiceHandler = {
    gainNode: null,
    audioCtx: null,
    lowPassFilter: null, // 추가: 고주파 잡음 제거
    highPassFilter: null, // 추가: 저주파 웅웅거림 제거

    // [고음질 튜닝] SDP 비트레이트 수정
    setHighBitrate(sdp) {
        return sdp.replace(/a=fmtp:111/g, "a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=510000;stereo=1;sprop-stereo=1");
    },

    async getMediaStream() {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true, // 브라우저 기본 노이즈 억제 활성화
                autoGainControl: false,
                sampleRate: 48000
            }
        });

        if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const source = this.audioCtx.createMediaStreamSource(stream);
        this.gainNode = this.audioCtx.createGain();
        
        // 1. 하이패스 필터: 100Hz 이하의 웅웅거리는 기계음 제거
        this.highPassFilter = this.audioCtx.createBiquadFilter();
        this.highPassFilter.type = "highpass";
        this.highPassFilter.frequency.value = 100;

        // 2. 로우패스 필터: 7000Hz 이상의 날카로운 금속음이나 쉬익 소리 제거
        this.lowPassFilter = this.audioCtx.createBiquadFilter();
        this.lowPassFilter.type = "lowpass";
        this.lowPassFilter.frequency.value = 7000;

        const destination = this.audioCtx.createMediaStreamDestination();

        // [연결 순서]: 마이크 -> 하이패스 -> 로우패스 -> 증폭기(Gain) -> 최종 출력
        source.connect(this.highPassFilter);
        this.highPassFilter.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.gainNode);
        this.gainNode.connect(destination);
        
        this.gainNode.gain.value = 1.0; 

        return destination.stream;
    }
};