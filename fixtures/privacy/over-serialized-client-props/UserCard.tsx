'use client'

export interface UserCardProps {
  name: string
  avatarUrl?: string
}

export function UserCard(props: UserCardProps) {
  return (
    <span>
      {props.avatarUrl ? <img src={props.avatarUrl} alt="" /> : null}
      {props.name}
    </span>
  )
}
