import React from 'react';

export const GraphMarkers = () => {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="edge-circle"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <circle cx="5" cy="5" r="2.5" fill="#94a3b8" />
        </marker>
      </defs>
    </svg>
  );
};
