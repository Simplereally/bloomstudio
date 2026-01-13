toolName: search_codebase
            
status: success
          
query: Find implementation of fetchFromLeastBusyFluxServer and fetchFromLeastBusyServer; see how flux servers are contacted and what path (/generate) and response is expected.
          
**How It Decides Dimensions**

- Backend server: FLUX self-hosted uses nearest-valid snapping with caps [nunchaku/server.py:find_nearest_valid_dimensions](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L138-L175)
- Gateway: Scales requests below 1MP up to ~1MP, sends to self-hosted Flux, then resizes the final image back to your requested size if scaling occurred [createAndReturnImages.ts:calculateScaledDimensions](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/createAndReturnImages.ts#L85-L99), [createAndReturnImages.ts:resize-back](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/createAndReturnImages.ts#L267-L287)
- Self-hosted Flux constraints:
  - width and height must be multiples of 8
  - (width × height) must be divisible by 65,536
  - max total pixels capped at 768×768 = 589,824; requests above are proportionally downscaled before snapping
  - nearest-valid spiral search preserves aspect ratio as a goal, but snaps to discrete valid pairs [nunchaku/server.py](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L141-L172)

**Flow Map by Request Size**

- Below 1MP (width×height < 1,024,000):
  - Gateway scales up toward ~1MP, calls Flux
  - Flux caps to ≤589,824 px and snaps to a valid pair
  - Gateway resizes back to your requested width×height
- At/above 1MP:
  - Gateway sends as-is
  - Flux caps to ≤589,824 px and snaps to a valid pair
  - Gateway does not resize; you receive Flux’s snapped size

**Examples Covering All Paths**

- 64×64 (very small square)
  - Gateway: scales up toward ~1024×1024
  - Flux: caps to ≤768×768 and snaps to valid (e.g., 768×768 or 512×512)
  - Final to you: 64×64 (gateway resizes back)
  - Sources: [scale-up](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/createAndReturnImages.ts#L85-L99), [cap+snap](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L141-L172)

- 256×256 (min 65,536 px square)
  - Gateway: scales up toward ~1024×1024
  - Flux: snaps to valid under cap (e.g., 768×768)
  - Final to you: 256×256 (gateway resizes back)
  - Sources as above

- 512×128 (min-area non-square, 65,536 px)
  - Gateway: scales up toward ~1MP preserving ratio
  - Flux: snaps under cap to a valid pair (could be 1024×512? Too big; more likely 896×256 or similar multiples-of-8 with area divisible by 65,536)
  - Final to you: 512×128 (gateway resizes back)
  - Sources: [snap constraints](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L153-L170)

- 500×500 (250,000 px)
  - Gateway: scales toward ~1000×1000
  - Flux: caps/snaps (likely 768×768)
  - Final to you: 500×500 (gateway resizes back)
  - Sources: [resize-back](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/createAndReturnImages.ts#L267-L287)

- 1000×600 (600,000 px, multiples-of-8 not guaranteed)
  - Gateway: scales toward ~1290×775 (rounded)
  - Flux: caps to ≤589,824, snaps to valid near ratio (e.g., 1024×576 — exact cap, multiple-of-8, area = 65536×9)
  - Final to you: 1000×600 (gateway resizes back)
  - Sources: [cap exact hit example](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L141-L172)

- 1024×1024 (1,048,576 px ≥ 1MP)
  - Gateway: sends as-is
  - Flux: caps/snaps to 768×768 (exact cap square)
  - Final to you: 768×768 (no resize-back)
  - Sources: [cap](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L141-L151)

- 2048×2048 (4,194,304 px)
  - Gateway: sends as-is
  - Flux: caps/snaps to 768×768
  - Final to you: 768×768
  - Sources: [cap](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L141-L151)

- 2048×512 (1,048,576 px)
  - Gateway: sends as-is
  - Flux: downscales proportionally and snaps to valid at cap (e.g., 1536×384; area = 589,824 = 65536×9)
  - Final to you: 1536×384
  - Sources: [downscale+snap](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L146-L172)

- 4096×64 (extreme ratio, 262,144 px)
  - Gateway: scales toward ~8192×128
  - Flux: under cap; snaps to nearest valid multiples-of-8 with area multiple of 65,536 (e.g., 4096×128; area = 65536×8)
  - Final to you: 4096×64 (gateway resizes back)
  - Sources: [snap rules](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L153-L170)

- Missing width/height (defaults)
  - Gateway params default Flux to 1024×1024 [params.ts](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/params.ts#L34-L52)
  - Flux: caps/snaps to 768×768
  - Final to you: 768×768

**Constraint Summary**

- Minimum per-side: no explicit hard minimum; both sides must be multiples of 8; smallest valid area is 65,536 px (e.g., 512×128, 256×256). Extremely small inputs are snapped to the nearest valid pair.
- Maximum pixels: 589,824 px (768×768). Anything above is proportionally downscaled before snapping.
- Multiples required: width%8==0 and height%8==0; (width×height)%65536==0.
- Aspect ratio: preserved via proportional downscale, then “nearest valid” snapping can shift each side by ±8-px steps to satisfy divisibility.
- Gateway behavior:
  - If input < 1MP: scales up toward ~1MP for backend QoS, then resizes returned image back to your requested size.
  - If input ≥ 1MP: no scale-up; you receive Flux’s snapped size (≤768×768 or the cap-equivalent rectangle).
- Cloudflare Flux path:
  - When used, width/height are rounded to multiples of 8 client-side [createAndReturnImages.ts](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/createAndReturnImages.ts#L361-L370). Default routing prefers self-hosted Flux; Cloudflare fallback is disabled in current code [createAndReturnImages.ts](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/src/createAndReturnImages.ts#L1149-L1162).

**Gotchas and Unexpected Behaviors**

- Silent normalization: Oversized requests never 500/400; they’re auto-downscaled and snapped. You see adjusted width/height in Flux server responses [nunchaku/server.py](file:///c:/Code/pollinations-fork/pollinations/image.pollinations.ai/nunchaku/server.py#L224-L233).
- Discrete outputs: Because of the area divisibility, returned sizes are discrete steps; exact requested sizes are rarely returned unless they already satisfy the constraints.
- Resizes back only when gateway scaled up: If your original request was ≥1MP, the gateway won’t resize back; you get Flux’s snapped size.
- Extremely thin rectangles: Valid if multiples-of-8 and area multiple of 65,536; image quality can be odd for extreme ratios even though they pass constraints.
Server error. Please try again later. (-1)