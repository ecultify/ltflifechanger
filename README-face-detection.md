# Face Detection for Dynamic Image Placement

This implementation adds smart face detection to dynamically position user images in the poster generator. Instead of using fixed coordinates, the system now analyzes uploaded photos to detect faces and optimally position the image based on face location.

## Features

- **Face Detection**: Uses face-api.js to detect faces in user-uploaded images
- **Dynamic Positioning**: Calculates optimal image placement based on face position
- **Photo Type Classification**: Automatically identifies selfies, upper body, and full body shots
- **Graceful Degradation**: Falls back to smart default positioning when face detection fails
- **Consistent Results**: Ensures faces are properly visible regardless of original photo composition

## Setup Instructions

### 1. Install Dependencies

The face detection functionality requires face-api.js, which has been added to the project dependencies. Install it with:

```bash
npm install
```

### 2. Download Face Detection Models

The face detection models need to be downloaded and placed in the correct directory. A setup script has been provided to automate this process:

```bash
npm run setup-face-models
```

This will download the required models to `/public/models/` directory. The script uses CDN URLs from jsdelivr to fetch the latest compatible models for face-api.js.

**Note:** If you encounter any issues with the model download, the application will automatically attempt to load the models from the CDN at runtime as a fallback.

## Implementation Details

### Key Components

1. **Face Detection Utility** (`src/utils/faceDetection.js`):
   - Handles model loading and face detection
   - Classifies photo types (selfie, upper body, full body)
   - Calculates optimal image placement

2. **Integration with PosterGenerator** (`src/components/PosterGenerator.js`):
   - Uses face detection to dynamically position user images
   - Applies different scaling based on photo type
   - Falls back to default positioning when face detection fails

3. **Integration with SharePoster** (`src/pages/SharePoster.js`):
   - Implements the same face detection logic for the sharing page
   - Ensures consistent image placement across the application

### How It Works

1. When a user uploads an image, the system loads it into an Image element
2. The face detection utility analyzes the image to detect faces
3. Based on the face position and photo type, optimal placement parameters are calculated
4. The image is positioned on the poster canvas using these parameters
5. If face detection fails, the system falls back to smart default positioning

## Customization

The face detection parameters can be adjusted in the `faceDetection.js` utility:

- **Scale Factors**: Modify the `scaleFactors` object to adjust scaling for different photo types
- **Target Position**: Adjust the `targetFaceCenterX` and `targetFaceCenterY` values to change where faces should be positioned
- **Detection Threshold**: Change the `scoreThreshold` in the `TinyFaceDetectorOptions` to adjust detection sensitivity

## Troubleshooting

- **Models Not Loading**: Ensure the models are properly downloaded to `/public/models/`
- **Detection Not Working**: Check browser console for errors and verify that face-api.js is properly initialized
- **Poor Positioning**: Adjust the scale factors and target position parameters in `faceDetection.js`

## Performance Considerations

- Face detection adds processing overhead, especially on mobile devices
- The first detection might be slower as models are loaded
- Consider adding a loading indicator during face analysis
- For production, you may want to optimize the models or consider server-side processing