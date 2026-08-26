declare module "animejs" {
  interface AnimeParams {
    targets: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>;
    [key: string]: unknown;
  }

  interface AnimeInstance {
    play: () => void;
    pause: () => void;
    restart: () => void;
    seek: (time: number) => void;
    finished: Promise<void>;
    remove: () => void;
  }

  export default function anime(params: AnimeParams): AnimeInstance;
}
