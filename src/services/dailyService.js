import axios from 'axios';

export const createDailyRoom = async () => {
    try {
        const response = await axios.post(
            'https://api.daily.co/v1/rooms',
            {
                properties: {
                    exp: Math.round(Date.now() / 1000) + 3600, // expires in 1 hr
                    enable_chat: true,
                    enable_screenshare: true,
                    start_video_off: false,
                    start_audio_off: false,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            'Daily room creation failed:',
            error.response?.data || error.message
        );
        throw error;
    }
};