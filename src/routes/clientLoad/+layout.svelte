<div class="pageLayout">
	<nav>
		<a href="/layout/">Root</a><a href="/layout/home">Home</a><a href="/layout/blocked">Blocked</a>
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
