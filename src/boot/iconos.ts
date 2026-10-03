import { defineBoot } from '#q-app';
import { IconSet } from 'quasar';

export default defineBoot(() => {
  IconSet.iconMapFn = (nombre: string) =>
    nombre.startsWith('sym_') || !/^[a-z0-9_]+$/.test(nombre)
      ? undefined
      : { icon: `sym_r_${nombre}` };
});
