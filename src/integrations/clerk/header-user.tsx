import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'

export default function HeaderUser() {
  return (
    <>
      <Show when="signed-in">
        <UserButton />
        <Link to='/auth/home'>
          Home
        </Link>
      </Show>
      <Show when="signed-out">
        <SignInButton forceRedirectUrl={'/auth/home'} />
      </Show>
    </>
  )
}
