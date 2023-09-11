<div class="pageLayout">
	<nav>
		<a href="/clientLoad/">Root</a><a href="/clientLoad/home">Home</a><a href="/clientLoad/blocked"
			>Blocked</a
		>
	</nav>
	<slot />
</div>

<style>
	nav {
		display: flex;
		flex-direction: row;
		gap: 2rem;
	}
	.pageLayout {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		width: 100%;
		align-items: center;
	}
</style>
