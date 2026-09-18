/**
 * Farcaster frame meta tags.
 *
 * A card link pasted into a Farcaster feed renders in-line with a Battle
 * button. The frame post route reads the viewer's connected address from the
 * frame message and uses it as the challenger, so battling is one tap.
 */

export const appUrl = (): string =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const absolute = (path: string): string =>
  path.startsWith("http") ? path : `${appUrl()}${path}`;

export interface FrameMetaOptions {
  image: string;
  buttonLabel: string;
  /** Where the button posts to; the frame route resolves the challenger. */
  target: string;
}

/**
 * Both the legacy `fc:frame` tags and the current `fc:miniapp` JSON embed, so
 * the link renders in old and new clients alike.
 */
export function farcasterFrameMeta({
  image,
  buttonLabel,
  target,
}: FrameMetaOptions): Record<string, string> {
  const imageUrl = absolute(image);
  const postUrl = absolute("/api/frame");
  const targetUrl = absolute(target);

  const miniapp = {
    version: "1",
    imageUrl,
    button: {
      title: buttonLabel,
      action: { type: "launch_miniapp", name: "Onchain Battle Cards", url: targetUrl },
    },
  };

  return {
    "fc:frame": "vNext",
    "fc:frame:image": imageUrl,
    "fc:frame:image:aspect_ratio": "1.91:1",
    "fc:frame:button:1": buttonLabel,
    "fc:frame:button:1:action": "post",
    "fc:frame:post_url": postUrl,
    "fc:miniapp": JSON.stringify(miniapp),
  };
}
