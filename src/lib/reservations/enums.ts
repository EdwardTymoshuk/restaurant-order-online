// src/lib/reservations/enums.ts

/**
 * High-level reservation lifecycle status.
 * Used both in admin panel and backend workflows.
 */
export enum ReservationStatus {
  DRAFT = 'DRAFT', // wizard in progress / not submitted
  SENT = 'SENT', // submitted by client
  CONFIRMED = 'CONFIRMED', // confirmed by restaurant
  CANCELLED = 'CANCELLED', // cancelled by client or admin
}

/**
 * Type of event selected by the client.
 */
export enum EventType {
  BIRTHDAY = 'BIRTHDAY',
  ANNIVERSARY = 'ANNIVERSARY',
  COMMUNION = 'COMMUNION',
  CHRISTENING = 'CHRISTENING',
  COMPANY_EVENT = 'COMPANY_EVENT',
  OTHER = 'OTHER',
}

/**
 * Base package offered by the restaurant.
 */
export enum PackageCode {
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

/**
 * Type of additional paid or informational extras.
 */
export enum ReservationExtraType {
  EXTENDED_TIME = 'EXTENDED_TIME',
  COLD_PLATE = 'COLD_PLATE',
  PREMIUM_PLATTER = 'PREMIUM_PLATTER',
  KIDS_MENU = 'KIDS_MENU',
  DESSERTS = 'DESSERTS',
  CAKE = 'CAKE',
  SPECIAL_DIET = 'SPECIAL_DIET',
}
