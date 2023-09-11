<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="pageLayout">
	<nav>
		<a href="/clientLoad">Client Load</a><a href="/layout">Layout</a><a href="/hooks">Hooks</a>
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
