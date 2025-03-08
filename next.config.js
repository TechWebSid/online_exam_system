/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        // TensorFlow.js specific configuration
        config.resolve.alias = {
            ...config.resolve.alias,
            '@tensorflow/tfjs-backend-webgl': '@tensorflow/tfjs-backend-webgl',
        };
        
        return config;
    },
    // Increase the buffer size for large model files
    experimental: {
        largePageDataBytes: 128 * 100000, // 12.8MB
    }
};

module.exports = nextConfig; 