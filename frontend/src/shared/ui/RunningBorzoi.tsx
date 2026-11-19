import { createPortal } from "react-dom";

export const RunningBorzoi = () => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="borzoi-track" aria-hidden="true">
      <div className="borzoi-runner">
        <div className="borzoi-shadow" />
        <div className="borzoi-bob">
          <svg
            className="borzoi-svg"
            viewBox="0 0 460 176"
            fill="none"
          >
            <g className="borzoi-tail">
              <path
                d="M128 74C90 80 52 102 28 132"
                stroke="#7066cc"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M122 80C84 98 56 122 42 152"
                stroke="#9b94da"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M124 68C86 64 52 82 26 112"
                stroke="#7066cc"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>
            <g className="borzoi-leg borzoi-hind">
              <path
                fill="#5c53b8"
                d="M118 80C104 108 82 138 64 160L78 162C92 140 108 112 124 88Z"
              />
            </g>
            <g className="borzoi-leg borzoi-hind borzoi-near">
              <path
                fill="#7066cc"
                d="M150 84C164 112 178 142 168 162L184 160C188 138 170 110 156 90Z"
              />
            </g>
            <g className="borzoi-leg borzoi-fore">
              <path
                fill="#5c53b8"
                d="M214 102C198 122 178 144 166 162L182 164C190 144 206 122 222 104Z"
              />
            </g>
            <g className="borzoi-leg borzoi-fore borzoi-near">
              <path
                fill="#7066cc"
                d="M246 96C270 116 300 140 314 162L298 164C288 140 262 116 240 100Z"
              />
            </g>
            <path
              fill="#7066cc"
              d="M420 58C400 46 370 40 340 42C316 38 292 36 270 42C250 36 232 46 214 56C186 50 150 52 118 64C102 70 90 82 98 96C112 104 140 92 164 84C186 94 214 108 244 110C268 106 276 92 268 80C286 74 312 74 342 78C372 82 398 76 420 66C426 62 424 58 420 58Z"
            />
            <path
              fill="#5a51b0"
              d="M294 40C278 26 260 36 270 52C280 46 290 44 294 40Z"
            />
            <circle cx="312" cy="50" r="2.3" fill="#241c4e" />
            <circle cx="421" cy="61" r="4.2" fill="#463d86" />
          </svg>
        </div>
      </div>
    </div>,
    document.body,
  );
};
