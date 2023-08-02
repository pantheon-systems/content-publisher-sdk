import { motion } from 'framer-motion';
import queryString from 'query-string';
import React from 'react';

import { IconInfo } from '../Icons/IconInfo';
import { IconReload } from '../Icons/IconReload';
import { IconHideUI } from '../Icons/IconHideUI';
import { IconLeftArrow } from '../Icons/IconLeftArrow';

interface Props {
  id: string;
  previewBarOverride?: React.ReactElement | undefined | null;
}

const textWithIconStyle: Partial<React.CSSProperties> = {
  display: 'flex',
  color: '#212121',
  alignItems: 'center',
  columnGap: '4px',
  flexDirection: 'row',
};

export const PreviewBar = ({ id, previewBarOverride }: Props) => {
  // const [viewFormat, setViewFormat] = React.useState('desktop');
  const [isHidden, setIsHidden] = React.useState(true);
  const [showReloadWarning, setShowReloadWarning] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof location !== 'undefined') {
      const parsed = queryString.parse(location.search);

      if (parsed.publishingLevel?.toString().toLowerCase() === 'realtime') {
        setIsHidden(false);
      }
    }
  }, []);

  // Show the reload warning after 10 minutes.
  React.useEffect(() => {
    setTimeout(() => {
      setShowReloadWarning(true);
    }, 10 * 60_000);
  }, []);

  if (previewBarOverride != null) {
    return React.cloneElement(previewBarOverride, {
      isHidden,
      setIsHidden,
      id,
    });
  }

  return (
    <>
      <motion.div
        style={{
          fontFamily: 'Roboto, sans-serif',
          zIndex: 5,
          display: isHidden ? 'none' : 'flex',
          position: 'absolute',
          justifyContent: 'space-between',
          alignItems: 'center',
          columnGap: '1rem',
          overflow: 'clip',
          background: 'white',
          width: '100%',
          textAlign: 'center',
          color: 'black',
          left: '0',
          top: '0',
          padding: '8px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            columnGap: '1rem',
          }}
        >
          <a
            style={{
              ...textWithIconStyle,
              background: '#DDE5E7',
              color: '#212121',
              padding: '8px 12px',
              borderRadius: '4px',
            }}
            href={`https://docs.google.com/document/d/${id}/edit`}
          >
            <IconLeftArrow /> GO BACK TO DOCS
          </a>
          <button
            style={{ ...textWithIconStyle }}
            onClick={() => location.reload()}
          >
            <IconReload /> RELOAD
          </button>
          <button
            style={{ ...textWithIconStyle }}
            onClick={() => setIsHidden(true)}
          >
            <IconHideUI /> HIDE UI
          </button>
        </div>
        <div>
          {showReloadWarning ? (
            <div
              style={{
                display: 'flex',
                color: '#212121',
                alignItems: 'center',
                columnGap: '4px',
                flexDirection: 'row',
              }}
            >
              <IconInfo />{' '}
              <span
                style={{
                  color: 'black',
                  opacity: '50%',
                }}
              >
                Reload current live preview to continue receiving realtime
                updates.
              </span>
            </div>
          ) : null}
        </div>
        {/* TODO: Re-enable this if a general solution is found. */}
        {/* <ViewFormatChooser
          viewFormat={viewFormat}
          setViewFormat={setViewFormat}
        /> */}
      </motion.div>
    </>
  );
};
