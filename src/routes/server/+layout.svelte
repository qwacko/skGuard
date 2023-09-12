<div class="pageLayout">
	<nav>
		<a href="/server/">Root</a>
		<a href="/server/home">Home</a>
		<a href="/server/blocked">Blocked</a>
		<a href="/server/idAllowed">id:allowed</a>
		<a href="/server/idBlocked">id:blocked</a>
		<a href="/server/idOther">id:other</a>
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
