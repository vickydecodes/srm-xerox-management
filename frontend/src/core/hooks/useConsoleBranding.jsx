import { useEffect } from 'react';

export function useConsoleBranding() {
  useEffect(() => {
    const isProd = true;
    const envLabel = isProd ? 'PRODUCTION' : 'DEVELOPMENT';
    const envColor = isProd ? '#ef4444' : '#22c55e';
    const envBg = isProd ? '#450a0a' : '#052e16';
    const version = '1.0.0';
    const builtBy = 'Cookie Inc.';
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';

    const logo = [
      '                                                  ',
      '                          ..                     ',
      '            ..........                           ',
      '         ...          .   .,...                  ',
      '       ..   ,;+*??%%?: ...+S,                    ',
      '      .  .+%S%*+;::*@?.     .**..                ',
      '     . .*#S+,      .+SS%?%*  ;;..                ',
      '    . ,S@+    .. .    ,;:+%%:                    ',
      '   ...S@: :?%+ .?SS*..%S*.,@S. ;,..              ',
      '   . ;@* :@@@@:.+%%*.,?S#S.;SS?+...              ',
      '   . ;@+ ,%S%*.         ... .:##. .              ',
      '   . ,#S. ....,. ..:*??:  .. :@? .               ',
      '    . ;@%.  ,@@#*..+#@@*..  :@S...               ',
      '     . :S#+. :*?; . .,,   ,?@?. .                ',
      '      . .+SS?;,.     .,;*%S?:  .                 ',
      '       .   ,+?%%%%%%%%%%*;.  ..                  ',
      '        ...    .,,,,,..    ..                    ',
      '           ....        ....                      ',
      '               .......                           ',
    ].join('\n');

    console.info(
      `%c${logo}`,
      'font-family: "Courier New", Courier, monospace; font-size: 9px; line-height: 1.15; color: #6366f1;'
    );

    console.info(
      '%cSAMPATH ACADEMY OF PHYSICS',
      [
        'font-family: system-ui, -apple-system, sans-serif',
        'font-size: 16px',
        'font-weight: 700',
        'color: #1e40af',
        'letter-spacing: 2px',
      ].join(';')
    );

    console.info(
      '%cCRM  Platform',
      [
        'font-family: system-ui, -apple-system, sans-serif',
        'font-size: 11px',
        'font-weight: 400',
        'color: #6b7280',
        'letter-spacing: 4px',
      ].join(';')
    );

    console.info(' ');

    console.info(
      `%c v${version} %c ${envLabel} %c ${timestamp} `,
      [
        'font-family: monospace',
        'font-size: 10px',
        'font-weight: 600',
        'color: #a5b4fc',
        'background: #1e1b4b',
        'padding: 2px 8px',
        'border-radius: 3px 0 0 3px',
      ].join(';'),
      [
        'font-family: monospace',
        'font-size: 10px',
        'font-weight: 700',
        `color: ${envColor}`,
        `background: ${envBg}`,
        'padding: 2px 8px',
      ].join(';'),
      [
        'font-family: monospace',
        'font-size: 10px',
        'color: #9ca3af',
        'background: #111827',
        'padding: 2px 8px',
        'border-radius: 0 3px 3px 0',
      ].join(';')
    );

    console.info(' ');

    console.info(
      `%c⬡ Built & maintained by ${builtBy}`,
      [
        'font-family: system-ui, -apple-system, sans-serif',
        'font-size: 11px',
        'font-weight: 500',
        'color: #818cf8',
      ].join(';')
    );

    console.info(' ');

    console.info(
      '%c⚠  Developer console — authorized personnel only',
      [
        'font-family: system-ui, -apple-system, sans-serif',
        'font-size: 11px',
        'color: #d97706',
        'font-style: italic',
      ].join(';')
    );

    console.info(
      '%c●  All sessions are logged  •  IP recorded  •  Tamper detection active',
      [
        'font-family: system-ui, -apple-system, sans-serif',
        'font-size: 10px',
        `color: ${envColor}`,
        'font-weight: 500',
        'letter-spacing: 0.3px',
      ].join(';')
    );

    console.info(' ');

  }, []);
}