const content = `
<div style="height: 100%; width: 100%; position: absolute; top: 0px; left: 0px; background-color: rgb(229, 227, 223);">
	<div style="height: 100%; width: 100%; display: table; background-color: #e0e0e0; position: relative; left: 0; top: 0;">
		<div style="border-radius: 1px; padding-top: 0; padding-left: 10%; padding-right: 10%; position: static; vertical-align: middle; display: table-cell;">
			<div style="text-align: center;">
				<img src="img/icon_error.png" draggable="false" style="user-select: none;">
			</div>
			<div style="margin: 5px; margin-bottom: 20px; color: #616161; font-family: Roboto, Arial, sans-serif; text-align: center; font-size: 24px;">
				Oops! You appear to be offline.
			</div>
			<div style="margin: 5px; color: #757575; font-family: Roboto, Arial, sans-serif; text-align: center; font-size: 12px;">
				We can't load Google Maps at the moment. You can continue to use the app, but you won't be able to use Google Maps.
			</div>
		</div>
	</div>
</div>
`;

const offlineMap = document.getElementById('map');
offlineMap.innerHTML = content;
window.initMap(true);
