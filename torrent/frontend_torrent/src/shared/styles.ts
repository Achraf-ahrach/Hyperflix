// Basic styles to prevent crashes
export const moviePlayerStyles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    bgcolor: '#000',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    bgcolor: '#000',
    gap: 2,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    bgcolor: '#000',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
    padding: '20px',
    zIndex: 2,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
  },
  progressBarContainer: {
    marginBottom: '10px',
    padding: '0 10px',
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
  },
  controlButton: {
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  timeDisplay: {
    color: 'white',
    ml: 2,
    fontSize: '0.875rem',
  },
  progressSlider: {
    color: '#ff0000',
    height: 4,
    '& .MuiSlider-thumb': {
      width: 12,
      height: 12,
      transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
      '&:before': {
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
      },
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0px 0px 0px 8px rgba(255, 0, 0, 0.16)',
      },
      '&.Mui-active': {
        width: 16,
        height: 16,
      },
    },
  }
};