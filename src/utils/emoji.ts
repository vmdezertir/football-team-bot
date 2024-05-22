import { EPlayerPosition } from '@app/interfaces';

export function getFlagEmoji(countryCode: string) {
  return [...countryCode.toUpperCase()]
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .reduce((a, b) => `${a}${b}`);
}

export function getPlayerPositionEmoji(position: EPlayerPosition) {
  switch (position) {
    case EPlayerPosition.Goalkeeper:
      return '🧤';
    case EPlayerPosition.Defender:
      return '🛡️';
    case EPlayerPosition.Midfielder:
      return '⚔️';
    case EPlayerPosition.Attacker:
      return '🎯';
    default:
      return '🥅';
  }
}

export function getLeagueTypeEmoji(type: string) {
  switch (type) {
    case 'Cup':
      return '🏆';
    case 'League':
      return '🥇';
    default:
      return '🥅';
  }
}
