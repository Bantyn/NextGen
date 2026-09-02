import { FC, SVGProps } from 'react';

interface Props extends SVGProps<SVGSVGElement> {
    color?: string;
    size?: number;
}
/**
 * Direction-aware icon pointing "backward". Renders as ChevronLeft in LTR and mirrors in RTL.
 *
 * Uses the `data-rtl-flip` attribute to flip via CSS. Add this rule to your global styles:
 * ```css
 * [data-rtl-flip]:dir(rtl) { transform: scaleX(-1); }
 * ```
 */
declare const ChevronPrevious: FC<Props>;

export { ChevronPrevious };
